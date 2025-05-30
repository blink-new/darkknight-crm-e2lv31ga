import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';

import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { CalendarEventFormModal } from '@/components/CalendarEventFormModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar as CalendarIcon, 
  PlusIcon, 
  MapPin, 
  User,
  CheckCircle,
  Trash2,
  Edit,
  Info,
  Globe,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { GoogleCalendarIntegration } from '@/components/GoogleCalendarIntegration';
import { GoogleCalendarDebug } from '@/components/GoogleCalendarDebug';
import { GoogleCalendarNotConnected } from '@/components/GoogleCalendarNotConnected';
import { GoogleCalendarUnavailable } from '@/components/GoogleCalendarUnavailable';
import { GoogleCalendarTest } from '@/components/GoogleCalendarTest';

export function Calendar() {
  const {
    events: crmEvents, 
    loading: crmLoading, 
    addEvent, 
    updateEvent, 
    deleteEvent, 
    getFormattedEvents: getCrmEvents
  } = useCalendarEvents();
  
  const {
    isConnected: isGoogleConnected,
    events: googleEvents,
    loading: googleLoading,
    fetchEvents: fetchGoogleEvents,
    getFormattedEvents: getGoogleEvents,
    checkConnection
  } = useGoogleCalendar();
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedGoogleEvent, setSelectedGoogleEvent] = useState<any>(null);
  const [isGoogleEvent, setIsGoogleEvent] = useState(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [hasCheckedConnection, setHasCheckedConnection] = useState<boolean>(false);
  const [showConnectBanner, setShowConnectBanner] = useState<boolean>(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  
  const calendarRef = useRef<FullCalendar | null>(null);

  // Check for debug mode on mount
  useEffect(() => {
    // Show debug UI when in development mode or with debug=true in URL
    const isDebugMode = 
      import.meta.env.DEV || 
      new URLSearchParams(window.location.search).get('debug') === 'true';
    
    setShowDebug(isDebugMode);
    
    // Silently check connection status once on mount
    if (typeof checkConnection === 'function') {
      const checkGoogleConnection = async () => {
        try {
          console.log('Checking Google Calendar connection...');
          const isConnected = await checkConnection(true);
          setHasCheckedConnection(true);
          setShowConnectBanner(!isConnected);
          setIntegrationError(null);
        } catch (error) {
          console.error('Error checking Google Calendar connection:', error);
          setHasCheckedConnection(true);
          // If the error contains "Edge Function not found", set the integration error
          if (error instanceof Error && error.message.includes('Edge Function not found')) {
            setIntegrationError(error.message);
            setShowConnectBanner(false);
          } else {
            setShowConnectBanner(true);
            setIntegrationError(null);
          }
        }
      };
      
      checkGoogleConnection();
    } else {
      console.error('checkConnection is not a function');
      setHasCheckedConnection(true);
      setShowConnectBanner(true);
    }
  }, [checkConnection]);

  // Only fetch Google events when we know the connection is established,
  // don't do connection checks on page load
  useEffect(() => {
    // Only attempt to fetch Google Calendar events if we know the connection is established
    if (isGoogleConnected) {
      fetchGoogleEvents();
      setShowConnectBanner(false);
    }
  }, [isGoogleConnected, fetchGoogleEvents]);

  // Handler to open the Google Calendar connect dialog
  const handleOpenConnectDialog = () => {
    const calendarIntegrationBtn = document.querySelector('.google-calendar-integration-button') as HTMLButtonElement;
    if (calendarIntegrationBtn) {
      calendarIntegrationBtn.click();
    }
  };

  // Handler for when a user selects a date range
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedEvent(null);
    setSelectedGoogleEvent(null);
    setIsGoogleEvent(false);
    
    const newEvent = {
      title: '',
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      contact_id: null,
      description: null,
      location: null,
    };
    setSelectedEvent(newEvent as CalendarEvent);
    setIsFormModalOpen(true);
  };

  // Handler for when a user clicks on an event
  const handleEventClick = (clickInfo: EventClickArg) => {
    // Check if this is a Google Calendar event
    if (clickInfo.event.extendedProps.source === 'google') {
      const eventId = clickInfo.event.id;
      const googleEvent = googleEvents.find(e => e.id === eventId);
      
      if (googleEvent) {
        setSelectedGoogleEvent(googleEvent);
        setIsGoogleEvent(true);
        setSelectedEvent(null);
        setIsViewModalOpen(true);
      }
      return;
    }
    
    // Otherwise, it's a CRM event
    const eventId = clickInfo.event.id;
    const fullEvent = crmEvents.find(e => e.id === eventId);
    
    if (fullEvent) {
      setSelectedEvent(fullEvent);
      setIsGoogleEvent(false);
      setSelectedGoogleEvent(null);
      setIsViewModalOpen(true);
    }
  };

  // Handle form submission (create or update)
  const handleFormSubmit = async (eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedEvent?.id) {
      // Update existing event
      await updateEvent(selectedEvent.id, eventData);
    } else {
      // Create new event
      await addEvent(eventData);
    }
    setIsFormModalOpen(false);
  };

  // Handle deleting an event
  const handleDeleteEvent = async () => {
    if (selectedEvent?.id) {
      await deleteEvent(selectedEvent.id);
      setIsViewModalOpen(false);
    }
  };

  // Handle editing an event
  const handleEditEvent = () => {
    setIsViewModalOpen(false);
    setIsFormModalOpen(true);
  };

  // Combine CRM and Google Calendar events
  const getAllEvents = (): EventInput[] => {
    const crmFormattedEvents = getCrmEvents();
    const googleFormattedEvents = isGoogleConnected ? getGoogleEvents() : [];
    return [...crmFormattedEvents, ...googleFormattedEvents];
  };
  
  const formattedEvents: EventInput[] = getAllEvents();
  const isLoading = crmLoading || googleLoading;

  return (
    <div className="p-6 md:p-10 bg-background min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary tracking-wider">Calendar</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage your events and appointments</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="google-calendar-integration-button">
            <GoogleCalendarIntegration />
          </div>
          <Button 
            onClick={() => {
              setSelectedEvent(null);
              setSelectedGoogleEvent(null);
              setIsGoogleEvent(false);
              setIsFormModalOpen(true);
            }}
            className="bg-primary hover:bg-yellow-400 text-black font-semibold py-3 px-6 text-base bat-glow"
          >
            <PlusIcon className="mr-2 h-5 w-5" /> New Event
          </Button>
        </div>
      </div>

      {/* Show integration unavailable message when we have a specific integration error */}
      {hasCheckedConnection && integrationError && (
        <GoogleCalendarUnavailable onSettings={handleOpenConnectDialog} />
      )}

      {/* Show the not connected banner only when we've checked and confirmed not connected */}
      {hasCheckedConnection && showConnectBanner && !integrationError && (
        <GoogleCalendarNotConnected onConnect={handleOpenConnectDialog} />
      )}

      <Card className="border-zinc-800 bg-card backdrop-blur-sm bat-shadow">
        <CardHeader className="border-b border-zinc-800 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="font-display text-2xl text-primary tracking-wide">Event Management</CardTitle>
            <Tabs defaultValue="month" className="w-full sm:w-auto" 
              onValueChange={(value) => {
                let fcView = 'dayGridMonth';
                switch (value) {
                  case 'week': fcView = 'timeGridWeek'; break;
                  case 'day': fcView = 'timeGridDay'; break;
                  case 'list': fcView = 'listWeek'; break;
                  default: fcView = 'dayGridMonth'; break;
                }
                calendarRef.current?.getApi().changeView(fcView);
              }}
            >
              <TabsList className="bg-sidebar border border-zinc-700">
                <TabsTrigger value="month" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                  Month
                </TabsTrigger>
                <TabsTrigger value="week" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                  Week
                </TabsTrigger>
                <TabsTrigger value="day" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                  Day
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bat-calendar">
            {isLoading && (
              <div className="p-10 flex justify-center items-center">
                <div className="animate-pulse text-primary text-lg">Loading events...</div>
              </div>
            )}
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: '',
              }}
              events={formattedEvents}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              nowIndicator={true}
              eventColor="#E8B710" // Primary yellow color
              eventClassNames="bat-event"
              select={handleDateSelect}
              eventClick={handleEventClick}
              height="auto"
              contentHeight="auto"
              aspectRatio={1.8}
            />
          </div>
        </CardContent>
      </Card>

      {/* Only show debug component in debug mode */}
      {showDebug && (
        <div className="mt-8 space-y-8">
          <GoogleCalendarDebug />
          <GoogleCalendarTest />
        </div>
      )}

      {/* Event Creation/Edit Modal */}
      <CalendarEventFormModal
        open={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedEvent}
      />

      {/* CRM Event View Modal */}
      <Dialog open={isViewModalOpen && !isGoogleEvent} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border-sidebar-border bat-shadow">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-primary">
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              <div className="mt-2 flex items-center space-x-2 text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {selectedEvent?.start && format(new Date(selectedEvent.start), 'EEEE, MMM d, yyyy')}
                  {selectedEvent?.end && ` - ${format(new Date(selectedEvent.end), 'EEEE, MMM d, yyyy')}`}
                </span>
                <Badge variant="outline" className="ml-2 bg-zinc-800/50 border-zinc-700">
                  {selectedEvent?.allDay ? 'All Day' : 'Timed'}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedEvent?.location && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-primary mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground text-sm">{selectedEvent.location}</p>
                </div>
              </div>
            )}

            {selectedEvent?.contact && (
              <div className="flex items-start">
                <User className="h-5 w-5 text-primary mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Related Contact</p>
                  <div className="flex items-center mt-1">
                    <Avatar className="h-8 w-8 mr-2 border-2 border-zinc-700">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold text-xs">
                        {selectedEvent.contact.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground text-sm">{selectedEvent.contact.name}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedEvent?.description && (
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Description</p>
                  <p className="text-muted-foreground text-sm whitespace-pre-line">{selectedEvent.description}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 justify-end">
            <Button 
              variant="destructive" 
              className="text-sm gap-2"
              onClick={handleDeleteEvent}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
            <Button 
              variant="outline" 
              className="text-sm gap-2 border-zinc-700 hover:bg-zinc-800 hover:text-primary"
              onClick={handleEditEvent}
            >
              <Edit className="h-4 w-4" /> Edit
            </Button>
            <Button 
              className="text-sm gap-2 bg-primary hover:bg-yellow-400 text-black font-semibold"
              onClick={() => setIsViewModalOpen(false)}
            >
              <CheckCircle className="h-4 w-4" /> Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Google Calendar Event View Modal */}
      <Dialog open={isViewModalOpen && isGoogleEvent} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border-sidebar-border bat-shadow">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#4285F4] text-white">Google Calendar</Badge>
              <DialogTitle className="text-xl font-display text-primary">
                {selectedGoogleEvent?.summary}
              </DialogTitle>
            </div>
            <DialogDescription>
              <div className="mt-2 flex items-center space-x-2 text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {selectedGoogleEvent?.start?.dateTime && 
                    format(new Date(selectedGoogleEvent.start.dateTime), 'EEEE, MMM d, yyyy, h:mm a')}
                  {selectedGoogleEvent?.start?.date && 
                    format(new Date(selectedGoogleEvent.start.date), 'EEEE, MMM d, yyyy')}
                  
                  {selectedGoogleEvent?.end?.dateTime && selectedGoogleEvent?.start?.dateTime &&
                    (new Date(selectedGoogleEvent.start.dateTime).toDateString() === 
                     new Date(selectedGoogleEvent.end.dateTime).toDateString() ?
                      ` - ${format(new Date(selectedGoogleEvent.end.dateTime), 'h:mm a')}` :
                      ` - ${format(new Date(selectedGoogleEvent.end.dateTime), 'EEEE, MMM d, yyyy, h:mm a')}`
                    )
                  }
                </span>
                <Badge variant="outline" className="ml-2 bg-zinc-800/50 border-zinc-700">
                  {!selectedGoogleEvent?.start?.dateTime ? 'All Day' : 'Timed'}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedGoogleEvent?.organizer && (
              <div className="flex items-start">
                <User className="h-5 w-5 text-[#4285F4] mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Organizer</p>
                  <div className="flex items-center mt-1">
                    <Avatar className="h-8 w-8 mr-2 border-2 border-zinc-700">
                      <AvatarFallback className="bg-[#4285F4]/20 text-[#4285F4] font-semibold text-xs">
                        {(selectedGoogleEvent.organizer.displayName || selectedGoogleEvent.organizer.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground text-sm">
                      {selectedGoogleEvent.organizer.displayName || selectedGoogleEvent.organizer.email}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedGoogleEvent?.location && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-[#4285F4] mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground text-sm">{selectedGoogleEvent.location}</p>
                </div>
              </div>
            )}

            {selectedGoogleEvent?.attendees && selectedGoogleEvent.attendees.length > 0 && (
              <div className="flex items-start">
                <Globe className="h-5 w-5 text-[#4285F4] mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Attendees</p>
                  <div className="mt-1 space-y-1">
                    {selectedGoogleEvent.attendees.slice(0, 3).map((attendee: any, index: number) => (
                      <div key={index} className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2 border border-zinc-700">
                          <AvatarFallback className="bg-[#4285F4]/10 text-[#4285F4] font-semibold text-xs">
                            {(attendee.displayName || attendee.email).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground text-sm">{attendee.displayName || attendee.email}</span>
                        {attendee.responseStatus === 'accepted' && (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-2" />
                        )}
                      </div>
                    ))}
                    {selectedGoogleEvent.attendees.length > 3 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{selectedGoogleEvent.attendees.length - 3} more attendees
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedGoogleEvent?.description && (
              <div className="flex items-start">
                <Info className="h-5 w-5 text-[#4285F4] mr-3 mt-0.5" />
                <div>
                  <p className="font-medium">Description</p>
                  <p className="text-muted-foreground text-sm whitespace-pre-line">{selectedGoogleEvent.description}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              className="text-sm gap-2 border-zinc-700 hover:bg-zinc-800"
              onClick={() => window.open(selectedGoogleEvent?.htmlLink, '_blank')}
            >
              <ExternalLink className="h-4 w-4" /> Open in Google Calendar
            </Button>
            <Button 
              className="text-sm gap-2 bg-primary hover:bg-yellow-400 text-black font-semibold"
              onClick={() => setIsViewModalOpen(false)}
            >
              <CheckCircle className="h-4 w-4" /> Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add custom CSS for FullCalendar to make it Batman-themed */}
      <style>{`
        .bat-calendar .fc-theme-standard {
          --fc-border-color: rgba(82, 82, 91, 0.3);
          --fc-button-bg-color: #27272a;
          --fc-button-border-color: #3f3f46;
          --fc-button-hover-bg-color: #3f3f46;
          --fc-button-hover-border-color: #52525b;
          --fc-button-active-bg-color: #E8B710;
          --fc-button-active-border-color: #E8B710;
          --fc-button-text-color: #e4e4e7;
          --fc-button-active-text-color: #000000;
          --fc-event-bg-color: #E8B710;
          --fc-event-border-color: #E8B710;
          --fc-event-text-color: #000000;
          --fc-event-selected-overlay-color: rgba(232, 183, 16, 0.2);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: rgba(39, 39, 42, 0.5);
          --fc-neutral-text-color: #e4e4e7;
          --fc-today-bg-color: rgba(232, 183, 16, 0.1);
        }
        
        .bat-calendar .fc {
          color: #e4e4e7;
        }
        
        .bat-calendar .fc-toolbar-title {
          font-family: var(--font-display);
          color: #E8B710;
        }
        
        .bat-calendar .fc-col-header-cell {
          background-color: rgba(39, 39, 42, 0.7);
          font-weight: 600;
        }
        
        .bat-calendar .fc-event {
          border-radius: 6px;
          border-left: 3px solid #E8B710;
          box-shadow: 0 2px 10px rgba(232, 183, 16, 0.2);
          padding: 2px 4px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .bat-calendar .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(232, 183, 16, 0.3);
        }
        
        .bat-calendar .fc-daygrid-day-top {
          justify-content: center;
          padding-top: 3px;
        }
        
        .bat-calendar .fc-day-other .fc-daygrid-day-top {
          opacity: 0.6;
        }
        
        .bat-calendar .fc-button {
          text-transform: uppercase;
          font-weight: 500;
          letter-spacing: 0.5px;
          transition: all 0.2s ease;
        }
        
        .bat-calendar .fc-button-primary:not(:disabled).fc-button-active,
        .bat-calendar .fc-button-primary:not(:disabled):active {
          box-shadow: 0 0 10px rgba(232, 183, 16, 0.5);
        }
        
        .bat-calendar .fc-list-day-cushion {
          background-color: rgba(39, 39, 42, 0.9);
        }
        
        .bat-calendar .fc-list-event:hover td {
          background-color: rgba(232, 183, 16, 0.1);
        }
        
        .bat-calendar .fc-list-event-dot {
          border-color: #E8B710;
        }

        /* Google Calendar events styling */
        .bat-calendar .google-calendar-event {
          background-color: #4285F4 !important;
          border-color: #4285F4 !important;
          border-left: 3px solid #4285F4 !important;
          box-shadow: 0 2px 10px rgba(66, 133, 244, 0.2) !important;
        }
        
        .bat-calendar .google-calendar-event:hover {
          box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3) !important;
        }
      `}</style>
    </div>
  );
}

export default Calendar;