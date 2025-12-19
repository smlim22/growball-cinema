// Supabase Edge Function: send-feedback-notification
// Deploy this to Supabase Edge Functions using:
// supabase functions deploy send-feedback-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for the response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  showtime_id: number;
  movie_name: string;
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
    const { showtime_id, movie_name }: RequestBody = await req.json()

    if (!showtime_id || !movie_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: showtime_id and movie_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get FCM tokens for customers who have tickets for this showtime
    const { data: tokens, error: tokensError } = await supabase
      .from('customer_device')
      .select('fcm_token, cust_id')
      .in('cust_id', 
        supabase
          .from('ticket')
          .select('cust_id')
          .eq('showtime_id', showtime_id)
      )
      .not('fcm_token', 'is', null)

    if (tokensError) {
      console.error('Error fetching FCM tokens:', tokensError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch FCM tokens', details: tokensError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No FCM tokens found for this showtime' }),
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
    const notificationPromises = tokens.map(async (tokenData) => {
      const message = {
        message: {
          token: tokenData.fcm_token,
          notification: {
            title: 'Share Your Feedback',
            body: `How was ${movie_name} your cinema experience? We'd love your feedback!`,
          },
          data: {
            type: 'feedback_request',
            showtime_id: showtime_id.toString(),
            movie_name: movie_name,
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channel_id: 'feedback_notifications',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
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
          console.error(`Failed to send notification to ${tokenData.fcm_token}:`, errorText)
          return { success: false, token: tokenData.fcm_token, error: errorText }
        }

        const result = await response.json()
        return { success: true, token: tokenData.fcm_token, messageId: result.name }
      } catch (error) {
        console.error(`Error sending notification to ${tokenData.fcm_token}:`, error)
        return { success: false, token: tokenData.fcm_token, error: error.message }
      }
    })

    const results = await Promise.all(notificationPromises)
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        total: tokens.length,
        successful: successCount,
        failed: failureCount,
        showtime_id,
        movie_name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-feedback-notification function:', error)
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
   supabase link --project-ref YOUR_PROJECT_REF

4. Create the function directory:
   mkdir -p supabase/functions/send-feedback-notification

5. Copy this file to:
   supabase/functions/send-feedback-notification/index.ts

6. Get Firebase Service Account credentials:
   - Go to Firebase Console: https://console.firebase.google.com/
   - Select your project: "growball-cinemax-notification"
   - Go to Project Settings (gear icon) > Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file
   - Copy the entire content of the JSON file

7. Set the Firebase Service Account as a secret:
   
   IMPORTANT: The JSON must be on a single line. Use this command:
   
   supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
   
   OR use a file:
   cat firebase-service-account.json | tr -d '\n' | xargs -I {} supabase secrets set FIREBASE_SERVICE_ACCOUNT='{}'

8. Enable Firebase Cloud Messaging API (v1):
   - Go to Google Cloud Console: https://console.cloud.google.com/
   - Select your Firebase project
   - Go to APIs & Services > Library
   - Search for "Firebase Cloud Messaging API"
   - Click "Enable"

9. Deploy the function:
   supabase functions deploy send-feedback-notification

10. Test the function:
    curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-feedback-notification' \
      --header 'Authorization: Bearer YOUR_ANON_KEY' \
      --header 'Content-Type: application/json' \
      --data '{"showtime_id": 1, "movie_name": "Test Movie"}'

NOTES:
- This uses Firebase Cloud Messaging API v1 (not the deprecated legacy API)
- Service account provides OAuth2 authentication
- Tokens are valid for 1 hour and generated on each request
*/

