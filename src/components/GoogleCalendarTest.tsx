import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ENV } from '@/lib/env';

export function GoogleCalendarTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [defaultEndpoint, setDefaultEndpoint] = useState<string | null>(null);

  useEffect(() => {
    // Get the Supabase Functions URL
    const supabaseUrl = ENV.SUPABASE_FUNCTIONS_URL;
    setDefaultEndpoint(`${supabaseUrl}/google-calendar`);
  }, []);

  const testEndpoint = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Try the root endpoint
      const url = defaultEndpoint;
      console.log('Testing endpoint:', url);
      
      try {
        const response = await fetch(url as string, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setResult(JSON.stringify(data, null, 2));
      } catch (fetchError) {
        throw new Error(`Fetch error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      }
    } catch (error) {
      console.error('Test failed:', error);
      setError(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-card backdrop-blur-sm shadow-lg w-full">
      <CardHeader className="border-b border-zinc-800 pb-4">
        <CardTitle className="font-display text-xl text-primary tracking-wide">Google Calendar Function Test</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {result && (
          <Alert variant="default" className="bg-green-900/20 border-green-900/30">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            <AlertDescription>
              <p className="mb-2">Edge Function is working correctly!</p>
              <pre className="bg-black/30 p-3 rounded-md text-xs overflow-auto max-h-60">
                {result}
              </pre>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Testing endpoint:</p>
            <p className="font-mono text-sm bg-zinc-900/50 p-2 rounded-md overflow-x-auto">
              {defaultEndpoint || 'Loading...'}
            </p>
          </div>
          
          <Button
            onClick={testEndpoint}
            disabled={loading || !defaultEndpoint}
            className="bg-primary hover:bg-yellow-400 text-black font-semibold w-full"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Google Calendar Function
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}