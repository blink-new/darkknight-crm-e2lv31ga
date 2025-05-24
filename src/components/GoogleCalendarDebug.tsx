import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ENV } from '@/lib/env';

export function GoogleCalendarDebug() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };

  // Check the connection status
  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    addLog('Checking Google Calendar connection status...');
    
    try {
      // Get the current environment configuration
      addLog(`Current environment: SUPABASE_FUNCTIONS_URL = ${ENV.SUPABASE_FUNCTIONS_URL}`);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        addLog('Error: User not authenticated');
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      addLog(`Got session for user: ${session.user.id}`);
      addLog(`Calling status endpoint: ${ENV.SUPABASE_FUNCTIONS_URL}/google-calendar/status`);
      
      try {
        const response = await fetch(
          `${ENV.SUPABASE_FUNCTIONS_URL}/google-calendar/status`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        addLog(`Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          addLog(`API Error (${response.status}): ${errorText.substring(0, 150)}${errorText.length > 150 ? '...' : ''}`);
          setError(`Failed to check connection status: ${response.status} ${response.statusText}`);
          setLoading(false);
          return;
        }
        
        try {
          const data = await response.json();
          addLog(`Received response: ${JSON.stringify(data)}`);
          
          setStatus(data.connected ? 'Connected' : 'Not connected');
        } catch (jsonError) {
          addLog(`JSON parsing error: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
          setError(`Failed to parse response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
        }
      } catch (fetchError) {
        addLog(`Fetch error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        setError(`Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      }
      
      setLoading(false);
    } catch (error) {
      addLog(`Exception: ${error instanceof Error ? error.message : String(error)}`);
      setError(`Error checking status: ${error instanceof Error ? error.message : String(error)}`);
      setLoading(false);
    }
  };

  // Get auth URL and initiate OAuth flow
  const connectCalendar = async () => {
    setLoading(true);
    setError(null);
    addLog('Initiating Google Calendar connection...');
    
    try {
      // Get the current environment configuration
      addLog(`Current environment: SUPABASE_FUNCTIONS_URL = ${ENV.SUPABASE_FUNCTIONS_URL}`);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        addLog('Error: User not authenticated');
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      addLog(`Got session for user: ${session.user.id}`);
      addLog(`Calling auth URL endpoint: ${ENV.SUPABASE_FUNCTIONS_URL}/google-calendar/get-auth-url`);
      
      try {
        const response = await fetch(
          `${ENV.SUPABASE_FUNCTIONS_URL}/google-calendar/get-auth-url`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        addLog(`Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          addLog(`API Error (${response.status}): ${errorText.substring(0, 150)}${errorText.length > 150 ? '...' : ''}`);
          setError(`Failed to get auth URL: ${response.status} ${response.statusText}`);
          setLoading(false);
          return;
        }
        
        try {
          const { url } = await response.json();
          addLog(`Received auth URL: ${url}`);
          
          // Open the OAuth consent screen in a popup window
          const width = 600;
          const height = 700;
          const left = (window.innerWidth - width) / 2;
          const top = (window.innerHeight - height) / 2;
          
          const popup = window.open(
            url,
            'Connect Google Calendar',
            `width=${width},height=${height},left=${left},top=${top}`
          );
          
          if (!popup) {
            addLog('Error: Popup window was blocked');
            setError('Popup window was blocked. Please allow popups for this site.');
            setLoading(false);
            return;
          }
          
          addLog('OAuth popup opened, waiting for connection...');
          
          // Setup a message listener for the popup callback
          const messageListener = async (event: MessageEvent) => {
            addLog(`Received message event from: ${event.origin}`);
            
            // Only accept messages from our own domain
            if (event.origin !== window.location.origin) {
              addLog(`Ignored message from different origin: ${event.origin}`);
              return;
            }
            
            addLog(`Message data: ${event.data}`);
            
            // Check if this is our integration success message
            if (event.data === 'google_calendar_connected') {
              addLog('Received successful connection message');
              window.removeEventListener('message', messageListener);
              
              if (popup) {
                popup.close();
              }
              
              // Check if the connection was successful
              await checkStatus();
            }
          };
          
          window.addEventListener('message', messageListener);
          
          // Check connection status after a delay (in case the user completes the flow)
          const checkStatusInterval = setInterval(async () => {
            if (popup?.closed) {
              addLog('Popup closed, checking connection status...');
              clearInterval(checkStatusInterval);
              window.removeEventListener('message', messageListener);
              
              // Check if the connection was successful
              await checkStatus();
            }
          }, 1000);
          
          // Timeout after 2 minutes
          setTimeout(() => {
            clearInterval(checkStatusInterval);
            window.removeEventListener('message', messageListener);
            
            if (!popup?.closed) {
              addLog('Connection timed out, closing popup...');
              popup?.close();
            }
            
            setLoading(false);
          }, 2 * 60 * 1000);
        } catch (jsonError) {
          addLog(`JSON parsing error: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
          setError(`Failed to parse response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
          setLoading(false);
        }
      } catch (fetchError) {
        addLog(`Fetch error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        setError(`Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        setLoading(false);
      }
    } catch (error) {
      addLog(`Exception: ${error instanceof Error ? error.message : String(error)}`);
      setError(`Error initiating connection: ${error instanceof Error ? error.message : String(error)}`);
      setLoading(false);
    }
  };

  // Initialize - just add a component mounted log, don't check automatically
  useEffect(() => {
    addLog('Component mounted');
    addLog(`Current environment: SUPABASE_FUNCTIONS_URL = ${ENV.SUPABASE_FUNCTIONS_URL}`);
  }, []);

  return (
    <Card className="border-zinc-800 bg-card backdrop-blur-sm shadow-lg w-full">
      <CardHeader className="border-b border-zinc-800 pb-4">
        <div className="flex flex-row justify-between items-center">
          <CardTitle className="font-display text-xl text-primary tracking-wide">Google Calendar Diagnostics</CardTitle>
          <Button 
            variant="ghost" 
            onClick={() => setShowDebug(!showDebug)} 
            className="text-xs"
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </Button>
        </div>
      </CardHeader>
      {showDebug && (
        <CardContent className="pt-6 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <p className="text-muted-foreground mb-1">Connection Status:</p>
              <p className={`font-medium ${status === 'Connected' ? 'text-green-500' : 'text-red-500'}`}>
                {loading ? 'Checking...' : status || 'Unknown'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={checkStatus}
                disabled={loading}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Check Status
              </Button>
              
              <Button 
                onClick={connectCalendar}
                disabled={loading}
                className="bg-primary hover:bg-yellow-400 text-black font-semibold"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Connect Google Calendar
              </Button>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center mb-2">
              <Info className="h-4 w-4 text-primary mr-2" />
              <h3 className="font-medium">Debug Logs</h3>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-md p-3 h-[200px] overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No logs yet...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="pb-1 border-b border-zinc-800/50 mb-1 last:border-0 last:mb-0">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}