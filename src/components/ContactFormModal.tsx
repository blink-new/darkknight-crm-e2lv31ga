import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Contact, Company } from '@/types';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ContactFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => void;
  initialData?: Partial<Contact>;
}

export function ContactFormModal({ open, onClose, onSubmit, initialData }: ContactFormModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    notes: '',
    tags: '',
    company_id: '',
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCompanies();
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        position: initialData.position || '',
        notes: initialData.notes || '',
        tags: (initialData.tags || []).join(', '),
        company_id: initialData.company_id ? initialData.company_id : 'null',
      });
    } else {
      setForm({ 
        name: '', 
        email: '', 
        phone: '', 
        position: '', 
        notes: '', 
        tags: '',
        company_id: 'null' 
      });
    }
  }, [initialData, open]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      console.log('Fetching companies...');
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
        
      if (error) {
        console.error('Error fetching companies:', error);
        return;
      }
      
      console.log('Companies fetched:', data);
      setCompanies(data || []);
    } catch (error) {
      console.error('Exception fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCompanyChange = (value: string) => {
    // Convert the "null" string value to an empty string for the backend
    setForm((prev) => ({ ...prev, company_id: value === "null" ? "" : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure company_id is empty string if "null" is selected
    onSubmit({
      ...form,
      company_id: form.company_id === "null" ? "" : form.company_id,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {initialData ? 'Update contact information' : 'Enter contact details below'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="bg-zinc-800 border-zinc-700"
            required
          />
          <Input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="bg-zinc-800 border-zinc-700"
            type="email"
          />
          <Input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className="bg-zinc-800 border-zinc-700"
          />
          <Input
            name="position"
            placeholder="Position"
            value={form.position}
            onChange={handleChange}
            className="bg-zinc-800 border-zinc-700"
          />
          
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Select
              value={form.company_id}
              onValueChange={handleCompanyChange}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="null" className="focus:bg-zinc-800 focus:text-white">
                  None
                </SelectItem>
                {companies.map((company) => (
                  <SelectItem 
                    key={company.id} 
                    value={company.id}
                    className="focus:bg-zinc-800 focus:text-white"
                  >
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Input
            name="notes"
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
            className="bg-zinc-800 border-zinc-700"
          />
          <Input
            name="tags"
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={handleChange}
            className="bg-zinc-800 border-zinc-700"
          />
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancel
            </Button>
            <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black ml-2">
              {initialData ? 'Update Contact' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}