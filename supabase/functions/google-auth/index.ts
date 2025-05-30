import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google OAuth 2.0 endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Create Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const url = new URL(req.url);
  const action = url.pathname.split('/').pop();

  // Get auth credentials - only needed for some actions
  let user = null;
  if (action !== 'authorize' && action !== 'callback') {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', status: 401 }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    user = userData.user;
  }

  // Handle different actions
  if (action === 'authorize') {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');
    
    if (!clientId || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Missing Google OAuth configuration', status: 500 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the state parameter to include user ID
    const { searchParams } = url;
    const state = searchParams.get('state') || '';

    // Create OAuth authorization URL with calendar scopes
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scopes.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', state);

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (action === 'callback') {
    const { searchParams } = url;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return new Response(
        JSON.stringify({ error: `Google OAuth error: ${error}`, status: 400 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!code || !state) {
      return new Response(
        JSON.stringify({ error: 'Missing code or state parameter', status: 400 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
      const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');
      
      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Missing Google OAuth configuration');
      }

      // Exchange code for tokens
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
      }

      // Get user info from state parameter (from authorize request)
      const userId = state;
      if (!userId) {
        throw new Error('Invalid state parameter');
      }

      // Store tokens in Supabase
      const { error: upsertError } = await supabase
        .from('user_integrations')
        .upsert({
          user_id: userId,
          provider: 'google_calendar',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id, provider',
        });

      if (upsertError) {
        throw new Error(`Error storing token: ${upsertError.message}`);
      }

      // Redirect to app with success param
      return new Response(
        `<html>
          <head>
            <title>Authentication Successful</title>
            <script>
              window.opener.postMessage({type: 'GOOGLE_AUTH_SUCCESS'}, '*');
              window.close();
            </script>
          </head>
          <body>
            <h1>Authentication Successful</h1>
            <p>You can close this window and return to the application.</p>
          </body>
        </html>`,
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/html' 
          } 
        }
      );
    } catch (error) {
      console.error('Google auth callback error:', error);
      return new Response(
        `<html>
          <head>
            <title>Authentication Failed</title>
            <script>
              window.opener.postMessage({type: 'GOOGLE_AUTH_ERROR', error: '${error.message}'}, '*');
              window.close();
            </script>
          </head>
          <body>
            <h1>Authentication Failed</h1>
            <p>Error: ${error.message}</p>
            <p>Please close this window and try again.</p>
          </body>
        </html>`,
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/html' 
          } 
        }
      );
    }
  }

  if (action === 'status') {
    // Check if user has connected Google Calendar
    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google_calendar')
      .eq('enabled', true)
      .single();

    return new Response(
      JSON.stringify({ connected: !!data && !error }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (action === 'events') {
    try {
      // Get user's Google Calendar integration
      const { data: integration, error: integrationError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar')
        .eq('enabled', true)
        .single();

      if (integrationError || !integration) {
        return new Response(
          JSON.stringify({ error: 'Google Calendar not connected', status: 400 }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(integration.expires_at);
      let accessToken = integration.access_token;

      if (now >= expiresAt && integration.refresh_token) {
        // Refresh the token
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
        
        const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: integration.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        const refreshData = await refreshResponse.json();
        
        if (!refreshResponse.ok) {
          throw new Error(`Token refresh failed: ${JSON.stringify(refreshData)}`);
        }

        // Update token in database
        await supabase
          .from('user_integrations')
          .update({
            access_token: refreshData.access_token,
            expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('provider', 'google_calendar');

        accessToken = refreshData.access_token;
      }

      // Parse query params for event filtering
      const { searchParams } = url;
      const timeMin = searchParams.get('timeMin') || new Date().toISOString();
      const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Fetch calendar events
      const eventsUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
      eventsUrl.searchParams.append('timeMin', timeMin);
      eventsUrl.searchParams.append('timeMax', timeMax);
      eventsUrl.searchParams.append('singleEvents', 'true');
      eventsUrl.searchParams.append('orderBy', 'startTime');
      
      const eventsResponse = await fetch(eventsUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!eventsResponse.ok) {
        const errorData = await eventsResponse.json();
        throw new Error(`Failed to fetch events: ${JSON.stringify(errorData)}`);
      }

      const eventsData = await eventsResponse.json();
      
      return new Response(
        JSON.stringify(eventsData),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return new Response(
        JSON.stringify({ error: `Failed to fetch events: ${error.message}`, status: 500 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  if (action === 'disconnect') {
    try {
      // Update integration status to disabled
      const { error } = await supabase
        .from('user_integrations')
        .update({ 
          enabled: false,
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar');
        
      if (error) {
        throw new Error(`Error disconnecting: ${error.message}`);
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      return new Response(
        JSON.stringify({ error: `Failed to disconnect: ${error.message}`, status: 500 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Invalid action', status: 400 }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});