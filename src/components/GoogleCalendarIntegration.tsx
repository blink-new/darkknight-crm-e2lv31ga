import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, CalendarClock, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function GoogleCalendarIntegration() {
  const { toast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0); // Used to force a refresh
  const [localConnectionStatus, setLocalConnectionStatus] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { 
    connect, 
    disconnect,
    checkConnection
  } = useGoogleCalendar();
  
  // Only check connection status when dialog opens
  useEffect(() => {
    let isMounted = true;
    
    if (isSettingsOpen) {
      setLocalLoading(true);
      setLocalError(null);
      
      // Check connection status silently
      const checkStatus = async () => {
        try {
          const isConnected = await checkConnection(true); // Use silent mode
          if (!isMounted) return;
          
          setLocalConnectionStatus(!!isConnected);
          setLocalLoading(false);
        } catch (err) {
          console.error("Error checking connection on dialog open:", err);
          if (!isMounted) return;
          
          setLocalConnectionStatus(false);
          setLocalLoading(false);
          setLocalError(`Failed to check connection status: ${err instanceof Error ? err.message : String(err)}`);
        }
      };
      
      checkStatus();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isSettingsOpen, checkConnection, connectionAttempt]);
  
  const handleConnectCalendar = async () => {
    // Open settings dialog to show info
    setIsSettingsOpen(true);
  };
  
  const handleDisconnect = async () => {
    setLocalLoading(true);
    setLocalError(null);
    
    try {
      const success = await disconnect();
      if (success) {
        toast({
          title: "Disconnected",
          description: "Google Calendar has been disconnected.",
        });
        setLocalConnectionStatus(false);
        setIsSettingsOpen(false);
      }
      setLocalLoading(false);
    } catch (err) {
      console.error("Error disconnecting:", err);
      setLocalLoading(false);
      setLocalError(`Disconnection failed: ${err instanceof Error ? err.message : String(err)}`);
      
      toast({
        title: "Disconnection Error",
        description: "Could not disconnect from Google Calendar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async () => {
    setLocalLoading(true);
    setLocalError(null);
    
    try {
      await connect();
      // Force a connection status refresh after a short delay
      setTimeout(() => {
        setConnectionAttempt(prev => prev + 1);
      }, 2000);
    } catch (err) {
      console.error("Error connecting:", err);
      setLocalLoading(false);
      setLocalError(`Connection failed: ${err instanceof Error ? err.message : String(err)}`);
      
      toast({
        title: "Connection Error",
        description: "Could not connect to Google Calendar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCheckConnection = async () => {
    setLocalLoading(true);
    setLocalError(null);
    
    try {
      const isConnected = await checkConnection();
      setLocalConnectionStatus(!!isConnected);
      setLocalLoading(false);
      setConnectionAttempt(prev => prev + 1);
    } catch (err) {
      console.error("Error checking connection:", err);
      setLocalLoading(false);
      setLocalError(`Connection check failed: ${err instanceof Error ? err.message : String(err)}`);
      
      toast({
        title: "Connection Check Error",
        description: "Could not verify Google Calendar connection status.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button
        onClick={handleConnectCalendar}
        variant={localConnectionStatus ? "outline" : "default"}
        className={
          localConnectionStatus ? 
            "border-green-600 text-green-600 hover:text-green-500 hover:border-green-500" : 
            localError && localError.includes('Edge Function not found') ?
              "border-gray-700 text-gray-500 hover:text-gray-400 hover:border-gray-600" :
              "bg-primary hover:bg-yellow-400 text-black"
        }
        disabled={localLoading || (localError && localError.includes('Edge Function not found'))}
      >
        {localLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : localError && localError.includes('Edge Function not found') ? (
          <AlertCircle className="mr-2 h-4 w-4" />
        ) : (
          <CalendarClock className="mr-2 h-4 w-4" />
        )}
        {localConnectionStatus ? "Google Calendar Connected" : 
          localError && localError.includes('Edge Function not found') ? 
          "Integration Unavailable" : "Connect Google Calendar"}
      </Button>
      
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-sidebar-border bat-shadow">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-primary">
              Google Calendar Integration
            </DialogTitle>
            <DialogDescription>
              Connect your Google Calendar to sync events with DarkKnight CRM.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {localError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription className="space-y-2">
                  <p>{localError}</p>
                  {localError.includes('Edge Function not found') && (
                    <div className="mt-2 text-sm border p-2 rounded-md border-destructive/30 bg-destructive/10">
                      <p className="font-semibold">Administrator Information:</p>
                      <p className="mt-1">The Google Calendar integration requires a Supabase Edge Function to be deployed.</p>
                      <p className="mt-1">Please make sure the 'google-calendar' function is properly deployed with the required environment variables.</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="bg-muted/20 p-4 rounded-md border border-zinc-800">
              <h3 className="font-medium mb-2">Integration Benefits:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>View all your Google Calendar events alongside CRM events</li>
                <li>Create CRM events that automatically sync with Google Calendar</li>
                <li>Get notifications for upcoming appointments and meetings</li>
                <li>Stay organized with a centralized calendar view</li>
              </ul>
              <div className="mt-3 text-xs text-muted-foreground">
                <p>Note: You'll be redirected to Google to grant calendar access permissions.</p>
              </div>
            </div>
            
            <div className="bg-muted/20 p-4 rounded-md border border-zinc-800">
              <h3 className="font-medium mb-2">Integration Steps:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click "Connect Calendar" below</li>
                <li>Sign in to your Google account when prompted</li>
                <li>Review and grant calendar access permissions</li>
                <li>You'll be redirected back to DarkKnight CRM</li>
              </ol>
              <div className="mt-3 text-xs text-muted-foreground">
                <p>Your calendar data is securely handled and never shared with third parties.</p>
              </div>
            </div>
            
            {localConnectionStatus && (
              <div className="flex items-center p-3 bg-green-900/20 border border-green-900/30 rounded-md">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>Successfully connected to Google Calendar</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-800"
                onClick={() => window.open('https://calendar.google.com/', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Google Calendar
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleCheckConnection}
                disabled={localLoading}
                className="text-sm bg-zinc-800 hover:bg-zinc-700"
              >
                {localLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Refresh Status
              </Button>
            </div>
            
            {localConnectionStatus ? (
              <Button 
                variant="destructive"
                onClick={handleDisconnect}
                className="text-sm"
                disabled={localLoading}
              >
                {localLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Disconnect
              </Button>
            ) : (
              <Button
                className="bg-primary hover:bg-yellow-400 text-black font-semibold"
                onClick={async () => { await handleConnect(); }}
                disabled={localLoading}
              >
                {localLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Connect Calendar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}