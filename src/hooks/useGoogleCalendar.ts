import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { EventInput } from '@fullcalendar/core';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  htmlLink: string;
  colorId?: string;
  status: string;
}

export interface GoogleCalendarState {
  isConnected: boolean;
  events: GoogleCalendarEvent[];
  loading: boolean;
  error: string | null;
}

export function useGoogleCalendar() {
  const [state, setState] = useState<GoogleCalendarState>({
    isConnected: false,
    events: [],
    loading: false,
    error: null
  });

  // Store the functions URL locally
  const [functionsUrl, setFunctionsUrl] = useState<string | null>(null);

  // Get the Supabase Functions URL
  const getFunctionsUrl = (): string => {
    // Return cached URL if available
    if (functionsUrl) {
      return functionsUrl;
    }
    
    // First try to use the direct functions URL if available
    const directFunctionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string;
    if (directFunctionsUrl) {
      console.log('Using configured Supabase Functions URL:', directFunctionsUrl);
      setFunctionsUrl(directFunctionsUrl);
      return directFunctionsUrl;
    }
    
    // Fall back to constructing from the base URL
    const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    if (baseUrl) {
      // Create functions URL from Supabase URL
      const normalizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const derivedUrl = `${normalizedUrl}/functions/v1`;
      console.log('Using derived Supabase Functions URL:', derivedUrl);
      setFunctionsUrl(derivedUrl);
      return derivedUrl;
    }
    
    // Hard-coded fallback for this specific project
    const hardcodedUrl = 'https://zgqtllbobikwycchknsuu.supabase.co/functions/v1';
    console.log('Using hardcoded Supabase Functions URL:', hardcodedUrl);
    setFunctionsUrl(hardcodedUrl);
    return hardcodedUrl;
  };

  // Check if the user has connected their Google Calendar
  const checkConnection = useCallback(async (silent = false) => {
    try {
      // Get the functions URL
      const apiUrl = getFunctionsUrl();
      if (!apiUrl) {
        setState(prev => ({ ...prev, isConnected: false, loading: false, error: 'Supabase Functions URL is not configured' }));
        return false;
      }
      
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setState(prev => ({ ...prev, isConnected: false, loading: false }));
        return false;
      }
      
      console.log(`Checking Google Calendar connection status at: ${apiUrl}/google-calendar?action=status`);
      
      try {
        const response = await fetch(
          `${apiUrl}/google-calendar?action=status`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Handle 404 specifically - this means the function is not deployed
        if (response.status === 404) {
          console.error('Google Calendar function not found (404)');
          
          if (!silent) {
            toast.error("Google Calendar integration is not available. The Edge Function has not been deployed or is unreachable.");
          }
          
          setState(prev => ({ 
            ...prev, 
            isConnected: false, 
            loading: false, 
            error: 'Google Calendar Edge Function not found. Please contact your administrator.' 
          }));
          return false;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Status check failed (${response.status}): ${errorText}`);
          throw new Error(`Failed to check connection status: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Connection status response:', data);
        
        setState(prev => ({ ...prev, isConnected: data.connected, loading: false }));
        return data.connected;
      } catch (fetchError) {
        console.error('Network or parsing error:', fetchError);
        throw new Error(`API request failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}. Please try again later or contact support.`);
      }
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      // Don't show toast error on silent checks
      if (!silent) {
        toast.error(`Failed to check connection: ${error instanceof Error ? error.message : String(error)}`);
      }
      setState(prev => ({ ...prev, isConnected: false, error: `Connection check failed: ${error instanceof Error ? error.message : String(error)}`, loading: false }));
      return false;
    }
  }, []);

  // Connect to Google Calendar
  const connect = useCallback(async () => {
    // Get the functions URL
    const apiUrl = getFunctionsUrl();
    if (!apiUrl) {
      toast.error('API configuration error: Missing Supabase Functions URL');
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      console.log(`Getting OAuth URL from: ${apiUrl}/google-calendar?action=get-auth-url`);
      
      try {
        // Get the OAuth URL from our edge function
        const response = await fetch(
          `${apiUrl}/google-calendar?action=get-auth-url`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.status === 404) {
          console.error('Google Calendar function not found (404)');
          // Try the alternative URL (without the action) for debugging
          console.log('Trying alternative URL:', `${apiUrl}/google-calendar`);
          
          toast.error("Google Calendar integration is not available. The Edge Function has not been deployed or is unreachable. Please contact your administrator.");
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Google Calendar Edge Function not found. Please contact your administrator.' 
          }));
          return false;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to get auth URL (${response.status}): ${errorText}`);
          throw new Error(`Failed to get authentication URL: ${response.status} ${response.statusText}`);
        }
        
        // Await the JSON and extract the URL
        const data = await response.json();
        const url = data.url;
        
        if (!url) {
          throw new Error('No authentication URL received from server');
        }
        
        if (typeof url !== 'string') {
          throw new Error('OAuth URL is not a string! Got: ' + String(url));
        }
        console.log('Got OAuth URL (should be string):', url);
        
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
          throw new Error('Popup window was blocked. Please allow popups for this site.');
        }
        
        // Setup a message listener for the popup callback
        const messageListener = async (event: MessageEvent) => {
          console.log(`Received message event from: ${event.origin}, data: ${event.data}`);
          
          // Only accept messages from our own domain
          if (event.origin !== window.location.origin) {
            console.log(`Ignored message from different origin: ${event.origin}`);
            return;
          }
          
          // Check if this is our integration success message
          if (event.data === 'google_calendar_connected') {
            console.log('Received successful connection message');
            window.removeEventListener('message', messageListener);
            
            if (popup) {
              popup.close();
            }
            
            // Check if the connection was successful
            const isConnected = await checkConnection();
            if (isConnected) {
              toast.success('Google Calendar connected successfully');
            }
          }
        };
        
        window.addEventListener('message', messageListener);
        
        // Check connection status after a delay (in case the user completes the flow)
        const checkStatusInterval = setInterval(async () => {
          if (popup?.closed) {
            console.log('Popup closed, checking connection status...');
            clearInterval(checkStatusInterval);
            window.removeEventListener('message', messageListener);
            
            // Check if the connection was successful
            const isConnected = await checkConnection();
            setState(prev => ({ ...prev, loading: false }));
            
            if (isConnected) {
              toast.success('Google Calendar connected successfully');
              return true;
            } else {
              toast.error('Google Calendar connection was not completed');
              return false;
            }
          }
        }, 1000);
        
        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(checkStatusInterval);
          window.removeEventListener('message', messageListener);
          
          if (!popup?.closed) {
            console.log('Connection timed out, closing popup...');
            popup?.close();
          }
          
          setState(prev => ({ ...prev, loading: false }));
        }, 2 * 60 * 1000);
        
        return true;
      } catch (fetchError) {
        console.error('Network or parsing error:', fetchError);
        throw new Error(`API request failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error(`Failed to connect Google Calendar: ${error instanceof Error ? error.message : String(error)}`);
      setState(prev => ({ ...prev, loading: false, error: `Connection failed: ${error instanceof Error ? error.message : String(error)}` }));
      return false;
    }
  }, [checkConnection]);

  // Disconnect from Google Calendar
  const disconnect = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      // Update the user_integrations record
      const { error } = await supabase
        .from('user_integrations')
        .update({ 
          enabled: false,
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', session.user.id)
        .eq('provider', 'google_calendar');
        
      if (error) throw error;
      
      setState(prev => ({ ...prev, isConnected: false, events: [], loading: false }));
      toast.success('Google Calendar disconnected');
      return true;
    } catch (error) {
      console.error('Error disconnecting from Google Calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
      setState(prev => ({ ...prev, loading: false, error: 'Disconnection failed' }));
      return false;
    }
  }, []);

  // Fetch events from Google Calendar
  const fetchEvents = useCallback(async (timeMin?: string, timeMax?: string) => {
    if (!state.isConnected) {
      return [];
    }
    
    // Get the functions URL
    const apiUrl = getFunctionsUrl();
    if (!apiUrl) {
      setState(prev => ({ ...prev, error: 'API configuration error: Missing Supabase Functions URL', loading: false }));
      return [];
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      // Construct the URL with query parameters
      const url = new URL(`${apiUrl}/google-calendar?action=events`);
      
      if (timeMin) {
        url.searchParams.append('timeMin', timeMin);
      }
      
      if (timeMax) {
        url.searchParams.append('timeMax', timeMax);
      }
      
      // Fetch events from our edge function
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      const events = data.items || [];
      
      setState(prev => ({ ...prev, events, loading: false }));
      return events;
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      toast.error('Failed to fetch calendar events');
      setState(prev => ({ ...prev, loading: false, error: 'Failed to fetch events' }));
      return [];
    }
  }, [state.isConnected]);

  // Create an event in Google Calendar
  const createEvent = useCallback(async (eventData: any) => {
    if (!state.isConnected) {
      toast.error('Google Calendar is not connected');
      return null;
    }
    
    // Get the functions URL
    const apiUrl = getFunctionsUrl();
    if (!apiUrl) {
      toast.error('API configuration error: Missing Supabase Functions URL');
      return null;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      // Call our edge function to create the event
      const response = await fetch(
        `${apiUrl}/google-calendar?action=create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      
      const event = await response.json();
      
      // Add the new event to our state
      setState(prev => ({
        ...prev,
        events: [...prev.events, event],
        loading: false
      }));
      
      toast.success('Event created in Google Calendar');
      return event;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      toast.error('Failed to create event in Google Calendar');
      setState(prev => ({ ...prev, loading: false, error: 'Failed to create event' }));
      return null;
    }
  }, [state.isConnected]);

  // Update an event in Google Calendar
  const updateEvent = useCallback(async (eventId: string, eventData: any) => {
    if (!state.isConnected) {
      toast.error('Google Calendar is not connected');
      return null;
    }
    
    // Get the functions URL
    const apiUrl = getFunctionsUrl();
    if (!apiUrl) {
      toast.error('API configuration error: Missing Supabase Functions URL');
      return null;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      // Call our edge function to update the event
      const response = await fetch(
        `${apiUrl}/google-calendar?action=update`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ eventId, eventData })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to update event');
      }
      
      const event = await response.json();
      
      // Update the event in our state
      setState(prev => ({
        ...prev,
        events: prev.events.map(e => e.id === eventId ? event : e),
        loading: false
      }));
      
      toast.success('Event updated in Google Calendar');
      return event;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      toast.error('Failed to update event in Google Calendar');
      setState(prev => ({ ...prev, loading: false, error: 'Failed to update event' }));
      return null;
    }
  }, [state.isConnected]);

  // Delete an event from Google Calendar
  const deleteEvent = useCallback(async (eventId: string) => {
    if (!state.isConnected) {
      toast.error('Google Calendar is not connected');
      return false;
    }
    
    // Get the functions URL
    const apiUrl = getFunctionsUrl();
    if (!apiUrl) {
      toast.error('API configuration error: Missing Supabase Functions URL');
      return false;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      // Call our edge function to delete the event
      const response = await fetch(
        `${apiUrl}/google-calendar?action=delete&eventId=${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      // Remove the event from our state
      setState(prev => ({
        ...prev,
        events: prev.events.filter(e => e.id !== eventId),
        loading: false
      }));
      
      toast.success('Event deleted from Google Calendar');
      return true;
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      toast.error('Failed to delete event from Google Calendar');
      setState(prev => ({ ...prev, loading: false, error: 'Failed to delete event' }));
      return false;
    }
  }, [state.isConnected]);

  // Format Google events for FullCalendar
  const getFormattedEvents = useCallback((): EventInput[] => {
    return state.events.map(event => {
      const start = event.start.dateTime || event.start.date;
      const end = event.end.dateTime || event.end.date;
      const allDay = !event.start.dateTime;
      
      return {
        id: event.id,
        title: event.summary,
        start: start,
        end: end,
        allDay: allDay,
        url: event.htmlLink,
        extendedProps: {
          description: event.description,
          location: event.location,
          organizer: event.organizer,
          attendees: event.attendees,
          source: 'google',
        },
        classNames: ['google-calendar-event'],
        backgroundColor: '#4285F4', // Google Blue
        borderColor: '#4285F4',
      };
    });
  }, [state.events]);

  // We are NOT adding auto-connection check on mount
  // This will be done explicitly when needed

  return {
    isConnected: state.isConnected,
    events: state.events,
    loading: state.loading,
    error: state.error,
    connect,
    disconnect,
    checkConnection,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getFormattedEvents,
  };
}