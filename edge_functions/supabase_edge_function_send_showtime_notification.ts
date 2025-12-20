// Supabase Edge Function: send-showtime-notification
// Deploy this to Supabase Edge Functions using:
// supabase functions deploy send-showtime-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for the response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  showtime_id: number;
  old_date?: string;
  old_time?: string;
  new_date?: string;
  new_time?: string;
}

// Helper function to get OAuth2 access token
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const jwtClaimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }
  const jwtClaimSetEncoded = btoa(JSON.stringify(jwtClaimSet))
  
  // Import the private key
  const privateKey = serviceAccount.private_key
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  
  // Create signature
  const encoder = new TextEncoder()
  const data = encoder.encode(`${jwtHeader}.${jwtClaimSetEncoded}`)
  const keyBytes = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, data)
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  const jwt = `${jwtHeader}.${jwtClaimSetEncoded}.${signatureBase64}`
  
  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  
  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

// Helper function to format date
function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateStr;
  }
}

// Helper function to format time
function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  try {
    // Parse time string (format: HH:MM:SS)
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const hour = parseInt(parts[0]);
      const minute = parts[1];
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      return `${displayHour}:${minute} ${period}`;
    }
    return timeStr;
  } catch (e) {
    return timeStr;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { showtime_id, old_date, old_time, new_date, new_time }: RequestBody = await req.json()

    if (!showtime_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: showtime_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get showtime details with movie information
    const { data: showtime, error: showtimeError } = await supabase
      .from('showtimes')
      .select(`
        showtime_id,
        movie_id,
        date,
        time,
        movie:movie_id (
          movie_name
        )
      `)
      .eq('showtime_id', showtime_id)
      .single()

    if (showtimeError || !showtime) {
      console.error('Error fetching showtime:', showtimeError)
      return new Response(
        JSON.stringify({ error: 'Showtime not found', details: showtimeError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const movie = showtime.movie as any
    const movieName = movie?.movie_name || 'Unknown Movie'

    // Get all tickets for this showtime to find affected customers
    const { data: tickets, error: ticketsError } = await supabase
      .from('ticket')
      .select('cust_id')
      .eq('showtime_id', showtime_id)

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tickets', details: ticketsError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!tickets || tickets.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No tickets found for this showtime',
          showtime_id,
          movie_name: movieName,
          total: 0,
          successful: 0,
          failed: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get unique customer IDs
    const customerIds = [...new Set(tickets.map(t => t.cust_id))]

    // Get FCM tokens for these customers
    const { data: devices, error: devicesError } = await supabase
      .from('customer_device')
      .select('fcm_token, cust_id')
      .in('cust_id', customerIds)
      .not('fcm_token', 'is', null)

    if (devicesError) {
      console.error('Error fetching FCM tokens:', devicesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch FCM tokens', details: devicesError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No FCM tokens found for affected customers',
          showtime_id,
          movie_name: movieName,
          customers_affected: customerIds.length,
          total: 0,
          successful: 0,
          failed: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Firebase Service Account from environment
    const firebaseServiceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    if (!firebaseServiceAccountJson) {
      return new Response(
        JSON.stringify({ error: 'Firebase Service Account not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let serviceAccount
    try {
      serviceAccount = JSON.parse(firebaseServiceAccountJson)
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid Firebase Service Account JSON' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get OAuth2 access token
    const accessToken = await getAccessToken(serviceAccount)
    
    // Firebase project ID from service account
    const projectId = serviceAccount.project_id

    // Build notification message
    const oldDateTime = `${formatDate(old_date)} at ${formatTime(old_time)}`
    const newDateTime = `${formatDate(new_date)} at ${formatTime(new_time)}`
    
    let notificationBody: string;
    if (old_date !== new_date && old_time !== new_time) {
      // Both date and time changed
      notificationBody = `Your showtime for "${movieName}" has been rescheduled from ${oldDateTime} to ${newDateTime}`
    } else if (old_date !== new_date) {
      // Only date changed
      notificationBody = `Your showtime for "${movieName}" has been rescheduled to ${formatDate(new_date)}`
    } else if (old_time !== new_time) {
      // Only time changed
      notificationBody = `Your showtime for "${movieName}" has been rescheduled to ${formatTime(new_time)}`
    } else {
      // Fallback (shouldn't happen)
      notificationBody = `Your showtime for "${movieName}" has been updated. Tap to view details`
    }

    // Send FCM notifications using v1 API
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`
    const notificationPromises = devices.map(async (device) => {
      const message = {
        message: {
          token: device.fcm_token,
          notification: {
            title: 'Showtime Rescheduled',
            body: notificationBody,
          },
          data: {
            type: 'showtime_rescheduled',
            showtime_id: showtime_id.toString(),
            movie_name: movieName,
            old_date: old_date || '',
            old_time: old_time || '',
            new_date: new_date || '',
            new_time: new_time || '',
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channel_id: 'showtime_notifications',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        },
      }

      try {
        const response = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(message),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Failed to send notification to ${device.fcm_token}:`, errorText)
          return { success: false, token: device.fcm_token, cust_id: device.cust_id, error: errorText }
        }

        const result = await response.json()
        return { success: true, token: device.fcm_token, cust_id: device.cust_id, messageId: result.name }
      } catch (error) {
        console.error(`Error sending notification to ${device.fcm_token}:`, error)
        return { success: false, token: device.fcm_token, cust_id: device.cust_id, error: error.message }
      }
    })

    const results = await Promise.all(notificationPromises)
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        message: 'Showtime reschedule notifications sent',
        showtime_id,
        movie_name: movieName,
        old_datetime: oldDateTime,
        new_datetime: newDateTime,
        customers_affected: customerIds.length,
        total: devices.length,
        successful: successCount,
        failed: failureCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-showtime-notification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/* 
DEPLOYMENT INSTRUCTIONS:

1. Install Supabase CLI if not already installed:
   npm install -g supabase

2. Login to Supabase:
   supabase login

3. Link your project:
   supabase link --project-ref kkfjxsvnmgrmhtceaqty

4. Create the function directory:
   mkdir -p supabase/functions/send-showtime-notification

5. Copy this file to:
   supabase/functions/send-showtime-notification/index.ts

6. Use existing FIREBASE_SERVICE_ACCOUNT secret:
   (Already set from existing notification systems)
   If not set, run:
   supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'

7. Deploy the function:
   supabase functions deploy send-showtime-notification

8. Test the function:
   curl -i --location --request POST 'https://kkfjxsvnmgrmhtceaqty.supabase.co/functions/v1/send-showtime-notification' \
     --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZmp4c3ZubWdybWh0Y2VhcXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMDQyNjgsImV4cCI6MjA3NTg4MDI2OH0.edaLxos7JtdD4S1dHHDvVf_oLUnhTAsFuyCY-6ZW310' \
     --header 'Content-Type: application/json' \
     --data '{"showtime_id": 1, "old_date": "2024-01-15", "old_time": "14:00:00", "new_date": "2024-01-15", "new_time": "16:00:00"}'

TESTING EXAMPLES:

1. Test with a specific showtime ID (time change):
   POST https://kkfjxsvnmgrmhtceaqty.supabase.co/functions/v1/send-showtime-notification
   Body: {
     "showtime_id": 1,
     "old_date": "2024-01-15",
     "old_time": "14:00:00",
     "new_date": "2024-01-15",
     "new_time": "16:00:00"
   }

2. Test with date change:
   Body: {
     "showtime_id": 1,
     "old_date": "2024-01-15",
     "old_time": "14:00:00",
     "new_date": "2024-01-16",
     "new_time": "14:00:00"
   }

3. Test with both date and time change:
   Body: {
     "showtime_id": 1,
     "old_date": "2024-01-15",
     "old_time": "14:00:00",
     "new_date": "2024-01-16",
     "new_time": "16:00:00"
   }

4. Expected success response:
   {
     "message": "Showtime reschedule notifications sent",
     "showtime_id": 1,
     "movie_name": "Interstellar",
     "old_datetime": "Mon Jan 15 2024 at 2:00 PM",
     "new_datetime": "Mon Jan 15 2024 at 4:00 PM",
     "customers_affected": 5,
     "total": 5,
     "successful": 5,
     "failed": 0
   }

5. Test error handling (invalid showtime_id):
   Body: {"showtime_id": 99999}
   Expected: 404 with "Showtime not found"

6. Test missing parameter:
   Body: {}
   Expected: 400 with "Missing required parameter: showtime_id"

7. Test showtime with no tickets:
   Body: {"showtime_id": [showtime_with_no_tickets]}
   Expected: 200 with "No tickets found for this showtime"

NOTES:
- This uses Firebase Cloud Messaging API v1 (not the deprecated legacy API)
- Service account provides OAuth2 authentication
- Reuses the FIREBASE_SERVICE_ACCOUNT secret from existing notification systems
- Notification format adapts based on what changed (date, time, or both)
- Only sends to customers who have purchased tickets for the affected showtime
- Supports multiple devices per customer
- Returns detailed statistics for monitoring
- Date and time are formatted in a user-friendly way
- Handles cases where no customers have tickets or FCM tokens gracefully
*/

