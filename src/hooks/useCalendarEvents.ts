import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { EventInput } from '@fullcalendar/core';
import { Contact } from '@/types';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
  contact_id: string | null;
  description: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  contact?: Contact;
}

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          id,
          title,
          start,
          end,
          "allDay",
          contact_id,
          description,
          location,
          created_at,
          updated_at,
          contact:contact_id(id, name, email, phone, company_id)
        `)
        .order('start', { ascending: true });

      if (error) throw error;
      
      // Convert database column names to our interface names
      const formattedData = data?.map(event => ({
        ...event,
        allDay: event.allDay,
      })) || [];
      
      setEvents(formattedData as CalendarEvent[]);
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Convert interface names to database column names
      const dbEventData = {
        title: eventData.title,
        start: eventData.start,
        end: eventData.end,
        "allDay": eventData.allDay,
        contact_id: eventData.contact_id,
        description: eventData.description,
        location: eventData.location,
      };
      
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(dbEventData)
        .select()
        .single();

      if (error) throw error;
      
      // Convert back to our interface format
      const newEvent = {
        ...data,
        allDay: data.allDay,
      } as CalendarEvent;
      
      setEvents(prev => [...prev, newEvent]);
      toast.success('Event created successfully');
      return newEvent;
    } catch (error: any) {
      console.error('Error adding calendar event:', error);
      toast.error('Failed to create event');
      return null;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<CalendarEvent>) => {
    try {
      // Convert interface names to database column names
      const dbEventData: any = { ...eventData };
      if ('allDay' in eventData) {
        dbEventData.allDay = eventData.allDay;
        delete dbEventData.allDay;
      }
      
      const { data, error } = await supabase
        .from('calendar_events')
        .update(dbEventData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Convert back to our interface format
      const updatedEvent = {
        ...data,
        allDay: data.allDay,
      } as CalendarEvent;
      
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      toast.success('Event updated successfully');
      return updatedEvent;
    } catch (error: any) {
      console.error('Error updating calendar event:', error);
      toast.error('Failed to update event');
      return null;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEvents(prev => prev.filter(event => event.id !== id));
      toast.success('Event deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting calendar event:', error);
      toast.error('Failed to delete event');
      return false;
    }
  };

  // Format events for FullCalendar
  const getFormattedEvents = (): EventInput[] => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      extendedProps: {
        description: event.description,
        location: event.location,
        contact: event.contact,
        contact_id: event.contact_id,
      }
    }));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    fetchEvents,
    getFormattedEvents,
  };
}