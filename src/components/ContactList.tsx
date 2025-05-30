import { Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BuildingIcon, Loader2Icon } from 'lucide-react';

interface ContactListProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function ContactList({ contacts, onEdit, onDelete, loading = false }: ContactListProps) {
  if (loading) {
    return (
      <div className="text-center text-zinc-400 py-12 flex items-center justify-center">
        <Loader2Icon className="h-6 w-6 mr-2 animate-spin" />
        Loading contacts...
      </div>
    );
  }
  
  if (contacts.length === 0) {
    return (
      <div className="text-center text-zinc-400 py-12">No contacts yet. Add your first one!</div>
    );
  }
  
  return (
    <div className="divide-y divide-zinc-800 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
      {contacts.map((contact) => (
        <div key={contact.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/60 transition-all">
          <div>
            <div className="font-semibold text-white text-lg">{contact.name}</div>
            <div className="text-zinc-400 text-sm">{contact.email || 'No email'} &bull; {contact.phone || 'No phone'}</div>
            
            {contact.company && (
              <div className="flex items-center text-sm text-zinc-400 mt-1">
                <BuildingIcon className="h-3 w-3 mr-1" />
                {contact.company.name}
              </div>
            )}
            
            {contact.tags && contact.tags.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {contact.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-zinc-700 bg-zinc-800/50">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => onEdit(contact)}>
              Edit
            </Button>
            <Button size="sm" variant="destructive" className="ml-1" onClick={() => onDelete(contact.id)}>
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}