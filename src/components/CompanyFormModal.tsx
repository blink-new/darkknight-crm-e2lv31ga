import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Company } from '@/types';

const companyFormSchema = z.object({
  name: z.string().min(1, { message: 'Company name is required' }),
  website: z.string().url({ message: 'Must be a valid URL' }).optional().nullable().or(z.literal('')),
  industry: z.string().optional().nullable().or(z.literal('')),
  size: z.string().optional().nullable().or(z.literal('')),
  location: z.string().optional().nullable().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

const industryOptions = [
  'Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education',
  'Entertainment', 'Transportation', 'Construction', 'Energy', 'Other'
];

const companySizeOptions = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
];

interface CompanyFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyFormValues) => Promise<void>;
  initialData?: Company | null;
}

export function CompanyFormModal({ open, onClose, onSubmit, initialData }: CompanyFormModalProps) {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      website: '',
      industry: '',
      size: '',
      location: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        website: initialData.website || '',
        industry: initialData.industry || 'none',
        size: initialData.size || 'none',
        location: initialData.location || '',
      });
    } else {
      form.reset({
        name: '',
        website: '',
        industry: 'none',
        size: 'none',
        location: '',
      });
    }
  }, [initialData, form, open]);

  const handleFormSubmit = async (data: CompanyFormValues) => {
    await onSubmit(data);
    onClose(); 
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Company' : 'Add Company'}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {initialData ? 'Update company information' : 'Enter company details below'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Wayne Enterprises" {...field} className="bg-zinc-800 border-zinc-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://wayne.com" {...field} value={field.value ?? ''} className="bg-zinc-800 border-zinc-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="none" className="focus:bg-zinc-800 focus:text-white">None</SelectItem>
                        {industryOptions.map((industry) => (
                          <SelectItem key={industry} value={industry} className="focus:bg-zinc-800 focus:text-white">
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                         <SelectItem value="none" className="focus:bg-zinc-800 focus:text-white">None</SelectItem>
                        {companySizeOptions.map((size) => (
                          <SelectItem key={size} value={size} className="focus:bg-zinc-800 focus:text-white">
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Gotham City, NY" {...field} value={field.value ?? ''} className="bg-zinc-800 border-zinc-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Cancel
              </Button>
              <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black ml-2">
                {initialData ? 'Update Company' : 'Add Company'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}