import { useState, useEffect, useCallback } from 'react';
import { Company } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCompanies = useCallback(async () => {
    if (!user) {
      setCompanies([]);
      setLoading(false);
      return;
    }
    console.log('[useCompanies] Fetching companies from database...');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }
      console.log('[useCompanies] Companies fetched:', data?.length || 0, 'records');
      setCompanies(data || []);
    } catch (error: any) {
      console.error('[useCompanies] Error fetching companies:', error);
      toast({
        title: 'Error fetching companies',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const addCompany = async (companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('[useCompanies] Adding new company:', companyData);
    setLoading(true);
    try {
      // Clean up data - convert 'none' values to null or empty strings
      const cleanData = {
        ...companyData,
        industry: companyData.industry === 'none' ? null : companyData.industry,
        size: companyData.size === 'none' ? null : companyData.size,
      };

      const { data, error } = await supabase
        .from('companies')
        .insert(cleanData)
        .select('*')
        .single();

      if (error) {
        throw error;
      }
      console.log('[useCompanies] Company added successfully:', data);
      setCompanies(prev => [data, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: 'Company added',
        description: `${companyData.name} has been added successfully.`,
      });
      return data;
    } catch (error: any) {
      console.error('[useCompanies] Error adding company:', error);
      toast({
        title: 'Error adding company',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const editCompany = async (id: string, updates: Partial<Company>) => {
    console.log('[useCompanies] Editing company:', id, updates);
    setLoading(true);
    try {
      // Clean up data - convert 'none' values to null or empty strings
      const cleanUpdates = {
        ...updates,
        industry: updates.industry === 'none' ? null : updates.industry,
        size: updates.size === 'none' ? null : updates.size, 
      };

      const { data, error } = await supabase
        .from('companies')
        .update(cleanUpdates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }
      console.log('[useCompanies] Company updated successfully:', data);
      setCompanies(prev => prev.map(c => c.id === id ? data : c).sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: 'Company updated',
        description: `${data.name} has been updated successfully.`,
      });
      return data;
    } catch (error: any) {
      console.error('[useCompanies] Error updating company:', error);
      toast({
        title: 'Error updating company',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteCompany = async (id: string) => {
    console.log('[useCompanies] Deleting company:', id);
    try {
      const companyToDelete = companies.find(c => c.id === id);
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      console.log('[useCompanies] Company deleted successfully');
      setCompanies(prev => prev.filter(c => c.id !== id));
      toast({
        title: 'Company deleted',
        description: companyToDelete ? `${companyToDelete.name} has been removed.` : 'Company has been removed.',
      });
      return true;
    } catch (error: any) {
      console.error('[useCompanies] Error deleting company:', error);
      toast({
        title: 'Error deleting company',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    companies,
    loading,
    fetchCompanies,
    addCompany,
    editCompany,
    deleteCompany,
  };
}