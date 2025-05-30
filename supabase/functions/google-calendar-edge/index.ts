import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { OAuth2Client } from "https://deno.land/x/oauth2_client@v1.0.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google API endpoints
const GOOGLE_API_URL = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI') || '';

    // Log environment variables (not their values, just if they exist)
    console.log('Environment variables check:');
    console.log('SUPABASE_URL exists:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
    console.log('GOOGLE_CLIENT_ID exists:', !!googleClientId);
    console.log('GOOGLE_CLIENT_SECRET exists:', !!googleClientSecret);
    console.log('GOOGLE_REDIRECT_URI exists:', !!redirectUri);

    if (!supabaseUrl || !supabaseServiceKey || !googleClientId || !googleClientSecret || !redirectUri) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error', details: 'Missing environment variables', status: 500 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user JWT token from request
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    // Verify the user token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', status: 401 }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();
    
    console.log('Requested action:', action);

    // Initialize OAuth2 client
    const oauth2Client = new OAuth2Client({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorizationEndpointUri: GOOGLE_OAUTH_URL,
      tokenUri: GOOGLE_TOKEN_URL,
      redirectUri: redirectUri,
      defaults: {
        scope: ['https://www.googleapis.com/auth/calendar'],
      },
    });

    // Utility function to get access token
    const getAccessToken = async () => {
      // Fetch tokens from Supabase
      const { data: integration, error: integrationError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar')
        .eq('enabled', true)
        .single();
        
      if (integrationError || !integration) {
        throw new Error('Google Calendar not connected');
      }
      
      // Check if token is expired and refresh if needed
      let accessToken = integration.access_token;
      const expiresAt = new Date(integration.expires_at).getTime();
      
      if (Date.now() > expiresAt && integration.refresh_token) {
        try {
          const refreshed = await oauth2Client.refreshToken.refresh(integration.refresh_token);
          
          // Update tokens in Supabase
          await supabase
            .from('user_integrations')
            .update({
              access_token: refreshed.accessToken,
              expires_at: new Date(Date.now() + (refreshed.expiresIn || 3600) * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .eq('provider', 'google_calendar');
            
          accessToken = refreshed.accessToken;
        } catch (error) {
          throw new Error(`Failed to refresh token: ${error.message}`);
        }
      }
      
      return accessToken;
    };

    // Handle different actions
    switch (action) {
      case 'get-auth-url': {
        const authUrl = await oauth2Client.code.getAuthorizationUri({
          state: user.id,
          scope: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly'],
        });

        return new Response(
          JSON.stringify({ url: authUrl.toString() }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'callback': {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        
        if (!code || !state) {
          return new Response(
            JSON.stringify({ error: 'Missing code or state', status: 400 }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        try {
          // Exchange code for tokens
          const tokens = await oauth2Client.code.getToken(req.url);
          
          // Store tokens in Supabase
          const { error: upsertError } = await supabase
            .from('user_integrations')
            .upsert({
              user_id: state,
              provider: 'google_calendar',
              access_token: tokens.accessToken,
              refresh_token: tokens.refreshToken,
              expires_at: new Date(Date.now() + (tokens.expiresIn || 3600) * 1000).toISOString(),
              enabled: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id, provider',
            });
            
          if (upsertError) {
            console.error('Error storing tokens:', upsertError);
            return new Response(
              JSON.stringify({ error: 'Failed to store tokens', status: 500 }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // Redirect to success page
          return new Response(
            `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Google Calendar Connection Successful</title>
                <script>
                  // Notify the opener window that we've connected
                  if (window.opener) {
                    window.opener.postMessage('google_calendar_connected', window.location.origin);
                  }
                  // Close this window after a short delay
                  setTimeout(function() {
                    window.close();
                    // Redirect if the window doesn't close
                    window.location.href = "${url.origin}/calendar?integration=success";
                  }, 1500);
                </script>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background-color: #18181b;
                    color: #e4e4e7;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    text-align: center;
                  }
                  .container {
                    padding: 2rem;
                    background-color: #27272a;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
                  }
                  h1 {
                    color: #E8B710;
                    margin-top: 0;
                  }
                  p {
                    margin-bottom: 0;
                  }
                  .icon {
                    font-size: 3rem;
                    color: #4CAF50;
                    margin-bottom: 1rem;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="icon">✓</div>
                  <h1>Connection Successful!</h1>
                  <p>Your Google Calendar has been connected to DarkKnight CRM.</p>
                  <p>This window will close automatically.</p>
                </div>
              </body>
            </html>
            `,
            { 
              status: 200, 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'text/html' 
              } 
            }
          );
        } catch (error) {
          console.error('Error during OAuth token exchange:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to exchange authorization code for tokens', details: error.message, status: 500 }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      case 'status': {
        try {
          // Check if user has connected Google Calendar
          const { data, error: queryError } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider', 'google_calendar')
            .eq('enabled', true)
            .single();

          console.log('Status check result:', { hasData: !!data, hasError: !!queryError });
          
          if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
            throw queryError;
          }

          return new Response(
            JSON.stringify({ connected: !!data }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error checking connection status:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to check connection status', details: error.message, connected: false, status: 500 }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      case 'events': {
        try {
          const accessToken = await getAccessToken();
          
          // Get query parameters
          const timeMin = url.searchParams.get('timeMin') || new Date().toISOString();
          const timeMax = url.searchParams.get('timeMax') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          
          // Fetch events from Google Calendar
          const calendarResponse = await fetch(
            `${GOOGLE_API_URL}/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          if (!calendarResponse.ok) {
            const errorData = await calendarResponse.text();
            console.error('Google Calendar API error:', errorData);
            return new Response(
              JSON.stringify({ error: 'Failed to fetch events', status: calendarResponse.status, details: errorData }),
              { status: calendarResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          const events = await calendarResponse.json();
          
          return new Response(
            JSON.stringify(events),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching events:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch events', details: error.message, status: 500 }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      case 'create': {
        try {
          const accessToken = await getAccessToken();
          
          // Get event data from request body
          const eventData = await req.json();
          
          // Validate essential event data
          if (!eventData.summary || (!eventData.start || !eventData.end)) {
            return new Response(
              JSON.stringify({ error: 'Missing required event data (summary, start, end)', status: 400 }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // Create event in Google Calendar
          const calendarResponse = await fetch(
            `${GOOGLE_API_URL}/calendars/primary/events`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventData),
            }
          );
          
          if (!calendarResponse.ok) {
            const errorData = await calendarResponse.text();
            console.error('Google Calendar API error (create):', errorData);
            return new Response(
              JSON.stringify({ error: 'Failed to create event', status: calendarResponse.status, details: errorData }),
              { status: calendarResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          const event = await calendarResponse.json();
          
          return new Response(
            JSON.stringify(event),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error creating Google Calendar event:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to create event', details: error.message, status: 500 }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      case 'update': {
        try {
          const accessToken = await getAccessToken();
          
          // Get update data from request body
          const { eventId, eventData } = await req.json();
          
          if (!eventId) {
            return new Response(
              JSON.stringify({ error: 'Missing event ID', status: 400 }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // Update event in Google Calendar
          const calendarResponse = await fetch(
            `${GOOGLE_API_URL}/calendars/primary/events/${eventId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventData),
            }
          );
          
          if (!calendarResponse.ok) {
            const errorData = await calendarResponse.text();
            console.error('Google Calendar API error (update):', errorData);
            return new Response(
              JSON.stringify({ error: 'Failed to update event', status: calendarResponse.status, details: errorData }),
              { status: calendarResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          const event = await calendarResponse.json();
          
          return new Response(
            JSON.stringify(event),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error updating Google Calendar event:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to update event', details: error.message, status: 500 }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      case 'delete': {
        try {
          const accessToken = await getAccessToken();
          
          // Get event ID from query parameter
          const eventId = url.searchParams.get('eventId');
          
          if (!eventId) {
            return new Response(
              JSON.stringify({ error: 'Missing event ID', status: 400 }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // Delete event from Google Calendar
          const calendarResponse = await fetch(
            `${GOOGLE_API_URL}/calendars/primary/events/${eventId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          // For successful deletion, Google returns 204 No Content
          if (!calendarResponse.ok) {
            const errorData = await calendarResponse.text();
            console.error('Google Calendar API error (delete):', errorData);
            return new Response(
              JSON.stringify({ error: 'Failed to delete event', status: calendarResponse.status, details: errorData }),
              { status: calendarResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          return new Response(
            JSON.stringify({ success: true, message: 'Event deleted successfully' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error deleting Google Calendar event:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to delete event', details: error.message, status: 500 }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action', action, status: 400 }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message, status: 500 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});