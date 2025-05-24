import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function GoogleAuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');
  const navigate = useNavigate();

  useEffect(() => {
    // This component is only rendered in the popup window
    // It should process any query parameters and close itself
    
    try {
      // Check URL for error parameter
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      
      if (error) {
        setStatus('error');
        setMessage(`Authentication failed: ${error}`);
        
        // Post error message to opener and close after delay
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error }, '*');
          setTimeout(() => window.close(), 2000);
        } else {
          // If no opener, redirect back to calendar page
          setTimeout(() => navigate('/calendar'), 2000);
        }
      } else {
        // Success - the actual token exchange is handled by our Supabase Edge Function
        // which will automatically redirect here with proper HTML/JS to close the popup
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');
      }
    } catch (err) {
      console.error('Error processing callback:', err);
      setStatus('error');
      setMessage(`An unexpected error occurred: ${err.message}`);
      
      // Post error message to opener
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: err.message }, '*');
        setTimeout(() => window.close(), 2000);
      } else {
        // If no opener, redirect back to calendar page
        setTimeout(() => navigate('/calendar'), 2000);
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (status === 'success' && window.opener) {
      try {
        // This message matches what the Edge Function expects
        window.opener.postMessage('google_calendar_connected', window.location.origin);
      } catch (err) {
        console.error('Error sending message to opener:', err);
      }
    }
  }, [status]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-md">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {status === 'processing' && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          
          {status === 'success' && (
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
              <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          
          <h2 className={`text-xl font-semibold ${
            status === 'error' ? 'text-destructive' : 
            status === 'success' ? 'text-green-600' : 'text-primary'
          }`}>
            {status === 'processing' ? 'Google Authentication' : 
             status === 'success' ? 'Authentication Successful' : 
             'Authentication Failed'}
          </h2>
          
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'error' && (
            <p className="text-sm text-muted-foreground">
              This window will close automatically. If it doesn't,{' '}
              <button 
                onClick={() => window.close()} 
                className="text-primary hover:underline"
              >
                click here
              </button>{' '}
              to close it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}