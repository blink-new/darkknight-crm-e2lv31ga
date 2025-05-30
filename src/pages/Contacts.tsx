import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { ContactFormModal } from '@/components/ContactFormModal';

export default function ContactsPage() {
  const { contacts, addContact, editContact, deleteContact, loading, refreshContacts } = useContacts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Ensure contacts are refreshed when the page is loaded
  useEffect(() => {
    console.log('Contacts page mounted, refreshing contacts...');
    refreshContacts();
  }, [refreshContacts]);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const handleEdit = (contact: any) => {
    setEditing(contact);
    setModalOpen(true);
  };
  const handleDelete = (id: string) => {
    deleteContact(id);
  };
  const handleSubmit = (data: any) => {
    if (editing) {
      editContact(editing.id, data);
    } else {
      addContact(data);
    }
    setModalOpen(false);
  };

  const handleSearch = (e: any) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary tracking-wider">Contacts</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage your network of contacts.</p>
        </div>
        <Button onClick={handleAdd} className="mt-4 sm:mt-0 bg-primary hover:bg-yellow-400 text-black font-semibold py-3 px-6 text-base bat-glow">
          <PlusIcon className="mr-2 h-5 w-5" /> Add New Contact
        </Button>
      </div>

      <Card className="border-zinc-800 bg-card backdrop-blur-sm bat-shadow">
        <CardHeader className="border-b border-zinc-800 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 bg-zinc-800/50 border-zinc-700 focus:ring-primary focus:border-primary"
              />
            </div>
            {/* Add filter button here if needed */}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={5} columns={5} showTableHeader={true} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="w-[80px]"></TableHead> {/* Avatar column */}
                    <TableHead className="cursor-pointer hover:text-primary transition-colors">
                      Name
                    </TableHead>
                    <TableHead className="cursor-pointer hover:text-primary transition-colors">
                      Email
                    </TableHead>
                    <TableHead className="cursor-pointer hover:text-primary transition-colors">
                      Phone
                    </TableHead>
                    <TableHead className="cursor-pointer hover:text-primary transition-colors">
                      Company
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.filter((contact) => contact.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || contact.email.toLowerCase().includes(searchTerm.toLowerCase())).map((contact) => (
                    <TableRow key={contact.id} className="border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                      <TableCell>
                        <Avatar className="h-10 w-10 border-2 border-zinc-700">
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {contact.first_name[0]}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {contact.first_name} {contact.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{contact.email}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.company?.name || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-zinc-700 bat-shadow">
                            <DropdownMenuItem onClick={() => {}} className="cursor-pointer focus:bg-zinc-800/70 focus:text-primary">
                              <Eye className="mr-2 h-4 w-4 text-primary/80" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(contact)} className="cursor-pointer focus:bg-zinc-800/70 focus:text-primary">
                              <Edit3 className="mr-2 h-4 w-4 text-primary/80" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(contact.id)} className="cursor-pointer focus:bg-red-500/10 text-red-500 focus:text-red-400">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-[80px]"></TableHead> {/* Avatar column */}
              <TableHead className="cursor-pointer hover:text-primary transition-colors">
                Name
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors">
                Email
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors">
                Phone
              </TableHead>
              <TableHead className="cursor-pointer hover:text-primary transition-colors">
                Company
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.filter((contact) => contact.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || contact.email.toLowerCase().includes(searchTerm.toLowerCase())).map((contact) => (
              <TableRow key={contact.id} className="border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                <TableCell>
                  <Avatar className="h-10 w-10 border-2 border-zinc-700">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {contact.first_name[0]}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {contact.first_name} {contact.last_name}
                </TableCell>
                <TableCell className="text-muted-foreground">{contact.email}</TableCell>
                <TableCell className="text-muted-foreground">{contact.phone}</TableCell>
                <TableCell className="text-muted-foreground">{contact.company?.name || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-zinc-700 bat-shadow">
                      <DropdownMenuItem onClick={() => {}} className="cursor-pointer focus:bg-zinc-800/70 focus:text-primary">
                        <Eye className="mr-2 h-4 w-4 text-primary/80" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(contact)} className="cursor-pointer focus:bg-zinc-800/70 focus:text-primary">
                        <Edit3 className="mr-2 h-4 w-4 text-primary/80" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(contact.id)} className="cursor-pointer focus:bg-red-500/10 text-red-500 focus:text-red-400">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ContactFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editing}
      />
    </div>
  );
}

export { ContactsPage as Contacts };