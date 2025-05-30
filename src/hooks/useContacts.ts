import { useState, useEffect, useCallback } from 'react';
import { Contact } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch contacts on component mount and when user changes
  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching contacts...');
      fetchContacts();
    }
  }, [user]);

  // Fetch all contacts
  const fetchContacts = useCallback(async () => {
    console.log('Fetching contacts from database...');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          company:companies(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('Contacts fetched:', data?.length || 0, 'records');
      setContacts(data || []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Error fetching contacts',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Add a new contact
  const addContact = async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('Adding new contact:', contact);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select(`
          *,
          company:companies(*)
        `)
        .single();

      if (error) {
        throw error;
      }

      console.log('Contact added successfully:', data);
      setContacts(prev => [data, ...prev]);
      toast({
        title: 'Contact added',
        description: `${contact.name} has been added successfully.`,
      });
    } catch (error: any) {
      console.error('Error adding contact:', error);
      toast({
        title: 'Error adding contact',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Edit a contact
  const editContact = async (id: string, updates: Partial<Contact>) => {
    console.log('Editing contact:', id, updates);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          company:companies(*)
        `)
        .single();

      if (error) {
        throw error;
      }

      console.log('Contact updated successfully:', data);
      setContacts(prev => prev.map(c => c.id === id ? data : c));
      toast({
        title: 'Contact updated',
        description: `${data.name} has been updated successfully.`,
      });
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast({
        title: 'Error updating contact',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete a contact
  const deleteContact = async (id: string) => {
    console.log('Deleting contact:', id);
    try {
      const contactToDelete = contacts.find(c => c.id === id);
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      console.log('Contact deleted successfully');
      setContacts(prev => prev.filter(c => c.id !== id));
      toast({
        title: 'Contact deleted',
        description: contactToDelete ? `${contactToDelete.name} has been removed.` : 'Contact has been removed.',
      });
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast({
        title: 'Error deleting contact',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    contacts,
    loading,
    addContact,
    editContact,
    deleteContact,
    setContacts,
    refreshContacts: fetchContacts,
  };
}