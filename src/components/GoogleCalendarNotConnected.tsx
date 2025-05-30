import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

type GoogleCalendarNotConnectedProps = {
  onConnect: () => void;
};

export function GoogleCalendarNotConnected({ onConnect }: GoogleCalendarNotConnectedProps) {
  return (
    <Alert variant="default" className="border-amber-500/30 bg-amber-500/10 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
          <AlertDescription className="text-muted-foreground">
            You haven't connected your Google Calendar yet. Connect to sync your events with DarkKnight CRM.
          </AlertDescription>
        </div>
        <Button 
          onClick={onConnect} 
          variant="outline"
          className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          Connect Calendar
        </Button>
      </div>
    </Alert>
  );
}