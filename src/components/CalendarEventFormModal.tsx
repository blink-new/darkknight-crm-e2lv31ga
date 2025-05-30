import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, CheckCircle, Loader2 } from 'lucide-react';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { useContacts } from '@/hooks/useContacts';
import { Contact } from '@/types';
import { format } from 'date-fns';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { toast } from 'sonner';

interface CalendarEventFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  initialData: CalendarEvent | null;
}

export function CalendarEventFormModal({ 
  open, 
  onClose, 
  onSubmit,
  initialData 
}: CalendarEventFormModalProps) {
  const [formData, setFormData] = useState<Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>>({
    title: '',
    start: '',
    end: '',
    allDay: false,
    contact_id: null,
    description: null,
    location: null,
  });
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactResults, setShowContactResults] = useState(false);
  const [syncWithGoogle, setSyncWithGoogle] = useState(false);
  
  const { contacts, loading: contactsLoading, searchContacts } = useContacts();
  const { isConnected: googleConnected, createEvent: createGoogleEvent } = useGoogleCalendar();
  
  const filteredContacts = searchTerm ? 
    searchContacts(searchTerm) : 
    contacts.slice(0, 5);

  // Initialize form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        start: initialData.start || '',
        end: initialData.end || '',
        allDay: initialData.allDay || false,
        contact_id: initialData.contact_id || null,
        description: initialData.description || null,
        location: initialData.location || null,
      });
      
      // If there's a contact_id, find the contact
      if (initialData.contact_id) {
        const contact = contacts.find(c => c.id === initialData.contact_id);
        if (contact) {
          setSelectedContact(contact);
        }
      } else {
        setSelectedContact(null);
      }
    } else {
      // Default to current date/time
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      setFormData({
        title: '',
        start: format(now, "yyyy-MM-dd'T'HH:mm"),
        end: format(oneHourLater, "yyyy-MM-dd'T'HH:mm"),
        allDay: false,
        contact_id: null,
        description: null,
        location: null,
      });
      setSelectedContact(null);
    }
    
    // Enable Google sync by default if Google Calendar is connected
    setSyncWithGoogle(googleConnected);
  }, [initialData, contacts, googleConnected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => {
      // If switching to all-day event, update start and end to be date-only
      if (checked && prev.start && prev.end) {
        const startDate = prev.start.split('T')[0];
        const endDate = prev.end.split('T')[0];
        return { 
          ...prev, 
          allDay: checked,
          start: startDate,
          end: endDate
        };
      }
      // If switching from all-day event, add time component
      else if (!checked && prev.start && prev.end) {
        const now = new Date();
        const timeStr = `T${format(now, 'HH:mm')}`;
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        const endTimeStr = `T${format(oneHourLater, 'HH:mm')}`;
        
        return { 
          ...prev, 
          allDay: checked,
          start: `${prev.start}${timeStr}`,
          end: `${prev.end}${endTimeStr}`
        };
      }
      
      return { ...prev, allDay: checked };
    });
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData(prev => ({ ...prev, contact_id: contact.id }));
    setShowContactResults(false);
  };

  const handleRemoveContact = () => {
    setSelectedContact(null);
    setFormData(prev => ({ ...prev, contact_id: null }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    
    if (!formData.start) {
      toast.error('Please enter a start date/time');
      return;
    }
    
    if (!formData.end) {
      toast.error('Please enter an end date/time');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create the event in CRM
      await onSubmit(formData);
      
      // If Google Calendar sync is enabled, create the event there too
      if (syncWithGoogle && googleConnected) {
        // Format the event data for Google Calendar
        const googleEventData = {
          summary: formData.title,
          description: formData.description || '',
          location: formData.location || '',
          start: formData.allDay ? 
            { date: formData.start } : 
            { dateTime: new Date(formData.start).toISOString() },
          end: formData.allDay ? 
            { date: formData.end } : 
            { dateTime: new Date(formData.end).toISOString() },
        };
        
        await createGoogleEvent(googleEventData);
      }
      
      toast.success('Event created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border-sidebar-border bat-shadow">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-primary">
            {initialData?.id ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title*</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Meeting with client"
              className="bg-background border-zinc-800"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Label htmlFor="allDay" className="cursor-pointer flex-grow">All Day Event</Label>
            <Switch
              id="allDay"
              checked={formData.allDay}
              onCheckedChange={handleSwitchChange}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">
                {formData.allDay ? 'Start Date' : 'Start Date & Time'}*
              </Label>
              <div className="relative">
                <Input
                  id="start"
                  name="start"
                  type={formData.allDay ? "date" : "datetime-local"}
                  value={formData.start}
                  onChange={handleInputChange}
                  className="bg-background border-zinc-800"
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end">
                {formData.allDay ? 'End Date' : 'End Date & Time'}*
              </Label>
              <div className="relative">
                <Input
                  id="end"
                  name="end"
                  type={formData.allDay ? "date" : "datetime-local"}
                  value={formData.end}
                  onChange={handleInputChange}
                  className="bg-background border-zinc-800"
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location || ''}
              onChange={handleInputChange}
              placeholder="Office, Google Meet, etc."
              className="bg-background border-zinc-800"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Related Contact</Label>
            {selectedContact ? (
              <div className="flex items-center justify-between p-3 bg-background border border-zinc-800 rounded-md">
                <div>
                  <p className="font-medium">{selectedContact.name}</p>
                  <p className="text-muted-foreground text-sm">{selectedContact.email}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRemoveContact}
                  className="hover:bg-background/10"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowContactResults(true);
                    }}
                    onFocus={() => setShowContactResults(true)}
                    className="bg-background border-zinc-800"
                  />
                  {showContactResults && (
                    <div className="absolute z-10 mt-1 w-full bg-card shadow-lg rounded-md border border-zinc-800 max-h-60 overflow-auto">
                      {contactsLoading ? (
                        <div className="p-2 text-center text-muted-foreground">
                          Loading contacts...
                        </div>
                      ) : filteredContacts.length ? (
                        <div>
                          {filteredContacts.map((contact) => (
                            <div
                              key={contact.id}
                              className="p-2 hover:bg-accent cursor-pointer"
                              onClick={() => handleContactSelect(contact)}
                            >
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-muted-foreground text-sm">{contact.email}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2 text-center text-muted-foreground">
                          No contacts found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowContactResults(!showContactResults)}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  {showContactResults ? 'Hide results' : 'Show all contacts'}
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="Event details and notes..."
              className="bg-background border-zinc-800 min-h-[100px]"
            />
          </div>
          
          {googleConnected && (
            <div className="flex items-center space-x-2 pt-2 border-t border-zinc-800">
              <Checkbox
                id="syncWithGoogle"
                checked={syncWithGoogle}
                onCheckedChange={(checked) => setSyncWithGoogle(checked as boolean)}
                className="data-[state=checked]:bg-[#4285F4] data-[state=checked]:border-[#4285F4]"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="syncWithGoogle"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Sync with Google Calendar
                </label>
                <p className="text-sm text-muted-foreground">
                  Create this event in Google Calendar as well
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="gap-2 bg-primary hover:bg-yellow-400 text-black font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                {initialData?.id ? 'Update Event' : 'Create Event'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}