// Supabase Edge Function: send-showtime-cancellation-notification
// Deploy this to Supabase Edge Functions using:
// supabase functions deploy send-showtime-cancellation-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for the response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  showtime_id: number;
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
    const { showtime_id }: RequestBody = await req.json()

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
        status,
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
    const showtimeDate = showtime.date
    const showtimeTime = showtime.time

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
    const formattedDate = formatDate(showtimeDate)
    const formattedTime = formatTime(showtimeTime)
    const dateTimeStr = `${formattedDate} at ${formattedTime}`
    
    const notificationBody = `We're sorry, but your showtime for "${movieName}" scheduled on ${dateTimeStr} has been cancelled. Please contact us for a refund or alternative showtime.`

    // Send FCM notifications using v1 API
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`
    const notificationPromises = devices.map(async (device) => {
      const message = {
        message: {
          token: device.fcm_token,
          notification: {
            title: 'Showtime Cancelled',
            body: notificationBody,
          },
          data: {
            type: 'showtime_cancelled',
            showtime_id: showtime_id.toString(),
            movie_name: movieName,
            showtime_date: showtimeDate || '',
            showtime_time: showtimeTime || '',
            formatted_datetime: dateTimeStr,
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channel_id: 'showtime_notifications',
              color: '#FF0000',
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
        message: 'Showtime cancellation notifications sent',
        showtime_id,
        movie_name: movieName,
        showtime_datetime: dateTimeStr,
        customers_affected: customerIds.length,
        total: devices.length,
        successful: successCount,
        failed: failureCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-showtime-cancellation-notification function:', error)
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
   mkdir -p supabase/functions/send-showtime-cancellation-notification

5. Copy this file to:
   supabase/functions/send-showtime-cancellation-notification/index.ts

6. Use existing FIREBASE_SERVICE_ACCOUNT secret:
   (Already set from existing notification systems)
   If not set, run:
   supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'

7. Deploy the function:
   supabase functions deploy send-showtime-cancellation-notification

8. Test the function:
   curl -i --location --request POST 'https://kkfjxsvnmgrmhtceaqty.supabase.co/functions/v1/send-showtime-cancellation-notification' \
     --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZmp4c3ZubWdybWh0Y2VhcXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMDQyNjgsImV4cCI6MjA3NTg4MDI2OH0.edaLxos7JtdD4S1dHHDvVf_oLUnhTAsFuyCY-6ZW310' \
     --header 'Content-Type: application/json' \
     --data '{"showtime_id": 1}'

TESTING EXAMPLES:

1. Test with a specific showtime ID that has tickets:
   POST https://kkfjxsvnmgrmhtceaqty.supabase.co/functions/v1/send-showtime-cancellation-notification
   Body: {"showtime_id": 1}

2. Expected success response:
   {
     "message": "Showtime cancellation notifications sent",
     "showtime_id": 1,
     "movie_name": "Interstellar",
     "showtime_datetime": "Mon Jan 15 2024 at 2:00 PM",
     "customers_affected": 5,
     "total": 5,
     "successful": 5,
     "failed": 0
   }

3. Test error handling (invalid showtime_id):
   Body: {"showtime_id": 99999}
   Expected: 404 with "Showtime not found"

4. Test missing parameter:
   Body: {}
   Expected: 400 with "Missing required parameter: showtime_id"

5. Test showtime with no tickets:
   Body: {"showtime_id": [showtime_with_no_tickets]}
   Expected: 200 with "No tickets found for this showtime"

INTEGRATION WITH MOBILE APP:

When customer receives a cancellation notification, the app should:
1. Display an alert with the cancellation details
2. Navigate to a refund/support page when notification is tapped
3. Update the e-ticket list to remove or mark the cancelled showtime
4. Optionally suggest alternative showtimes for the same movie

Example notification handler in Flutter:

```dart
void handleShowtimeCancelledNotification(Map<String, dynamic> data) {
  final showtimeId = data['showtime_id'];
  final movieName = data['movie_name'];
  final datetime = data['formatted_datetime'];
  
  // Show alert
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('Showtime Cancelled'),
      content: Text(
        'We\'re sorry, but your showtime for "$movieName" '
        'scheduled on $datetime has been cancelled. '
        'Please contact us for a refund or alternative showtime.'
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Close'),
        ),
        TextButton(
          onPressed: () {
            Navigator.pop(context);
            // Navigate to support/refund page
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => RefundPage(showtimeId: showtimeId))
            );
          },
          child: Text('Request Refund'),
        ),
      ],
    ),
  );
}
```

NOTES:
- This uses Firebase Cloud Messaging API v1 (not the deprecated legacy API)
- Service account provides OAuth2 authentication
- Reuses the FIREBASE_SERVICE_ACCOUNT secret from existing notification systems
- Notification emphasizes the cancellation and encourages customer to seek refund
- Only sends to customers who have purchased tickets for the cancelled showtime
- Supports multiple devices per customer
- Returns detailed statistics for monitoring
- Date and time are formatted in a user-friendly way
- Handles cases where no customers have tickets or FCM tokens gracefully
- Uses red color accent on Android notifications to indicate urgency
- Provides all necessary data in notification payload for app to handle appropriately
*/

