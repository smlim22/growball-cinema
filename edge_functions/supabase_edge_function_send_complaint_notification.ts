// Supabase Edge Function: send-complaint-notification
// Deploy this to Supabase Edge Functions using:
// supabase functions deploy send-complaint-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for the response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  complaint_id: number;
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { complaint_id }: RequestBody = await req.json()

    if (!complaint_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: complaint_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get complaint details including customer ID and title
    const { data: complaint, error: complaintError } = await supabase
      .from('complaint')
      .select('complaint_id, cust_id, title, status')
      .eq('complaint_id', complaint_id)
      .single()

    if (complaintError || !complaint) {
      console.error('Error fetching complaint:', complaintError)
      return new Response(
        JSON.stringify({ error: 'Complaint not found', details: complaintError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get FCM tokens for this customer
    const { data: devices, error: devicesError } = await supabase
      .from('customer_device')
      .select('fcm_token')
      .eq('cust_id', complaint.cust_id)
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
        JSON.stringify({ message: 'No FCM tokens found for this customer' }),
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

    // Send FCM notifications using v1 API
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`
    const notificationPromises = devices.map(async (device) => {
      const message = {
        message: {
          token: device.fcm_token,
          notification: {
            title: 'Complaint Resolved',
            body: `Your complaint '${complaint.title}' has been resolved. Tap to view details`,
          },
          data: {
            type: 'complaint_resolved',
            complaint_id: complaint_id.toString(),
            complaint_title: complaint.title || '',
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channel_id: 'complaint_notifications',
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
          return { success: false, token: device.fcm_token, error: errorText }
        }

        const result = await response.json()
        return { success: true, token: device.fcm_token, messageId: result.name }
      } catch (error) {
        console.error(`Error sending notification to ${device.fcm_token}:`, error)
        return { success: false, token: device.fcm_token, error: error.message }
      }
    })

    const results = await Promise.all(notificationPromises)
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        total: devices.length,
        successful: successCount,
        failed: failureCount,
        complaint_id,
        complaint_title: complaint.title,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-complaint-notification function:', error)
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
   mkdir -p supabase/functions/send-complaint-notification

5. Copy this file to:
   supabase/functions/send-complaint-notification/index.ts

6. Use existing FIREBASE_SERVICE_ACCOUNT secret:
   (Already set from feedback notification system)
   If not set, run:
   supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'

7. Deploy the function:
   supabase functions deploy send-complaint-notification

8. Test the function:
   curl -i --location --request POST 'https://kkfjxsvnmgrmhtceaqty.supabase.co/functions/v1/send-complaint-notification' \
     --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZmp4c3ZubWdybWh0Y2VhcXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMDQyNjgsImV4cCI6MjA3NTg4MDI2OH0.edaLxos7JtdD4S1dHHDvVf_oLUnhTAsFuyCY-6ZW310' \
     --header 'Content-Type: application/json' \
     --data '{"complaint_id": 1}'

TESTING EXAMPLES:

1. Test with a specific complaint ID:
   POST https://kkfjxsvnmgrmhtceaqty.supabase.co/functions/v1/send-complaint-notification
   Body: {"complaint_id": 1}

2. Expected success response:
   {
     "message": "Notifications sent",
     "total": 1,
     "successful": 1,
     "failed": 0,
     "complaint_id": 1,
     "complaint_title": "Issue with seats"
   }

3. Test error handling (invalid complaint_id):
   Body: {"complaint_id": 99999}
   Expected: 404 with "Complaint not found"

4. Test missing parameter:
   Body: {}
   Expected: 400 with "Missing required parameter: complaint_id"

NOTES:
- This uses Firebase Cloud Messaging API v1 (not the deprecated legacy API)
- Service account provides OAuth2 authentication
- Reuses the FIREBASE_SERVICE_ACCOUNT secret from feedback system
- Notification format: "Your complaint '[title]' has been resolved"
- Supports multiple devices per customer
- Returns detailed statistics for monitoring
*/

