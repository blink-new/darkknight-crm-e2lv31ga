import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface GoogleCalendarUnavailableProps {
  onSettings?: () => void;
}

export function GoogleCalendarUnavailable({ onSettings }: GoogleCalendarUnavailableProps) {
  return (
    <Alert variant="default" className="border-gray-700 bg-zinc-900/50 mb-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
          <div>
            <AlertTitle className="text-yellow-500 mb-1">Google Calendar Integration Unavailable</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              The Google Calendar integration is currently not available. This feature requires a backend service that is not properly configured.
            </AlertDescription>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-3 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Contact your administrator to configure the Google Calendar integration.
          </p>
          {onSettings && (
            <Button 
              onClick={onSettings} 
              variant="outline"
              size="sm"
              className="border-gray-700 hover:bg-gray-800"
            >
              <Settings className="mr-2 h-4 w-4" />
              Integration Details
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}