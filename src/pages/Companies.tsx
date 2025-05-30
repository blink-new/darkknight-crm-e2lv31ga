import { useState, useEffect } from 'react';
import { useCompanies } from '@/hooks/useCompanies';
import { Company } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { CompanyFormModal } from '@/components/CompanyFormModal';

export function Companies() {
  const { 
    companies, 
    loading,
    fetchCompanies,
    addCompany,
    editCompany,
    deleteCompany 
  } = useCompanies();
  
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  useEffect(() => {
    fetchCompanies(); 
  }, [fetchCompanies]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredCompanies(
        companies.filter(company => 
          company.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredCompanies(companies);
    }
  }, [searchQuery, companies]);

  const handleAddCompany = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleDeleteCompany = async (id: string) => {
    await deleteCompany(id);
  };

  const handleSubmitForm = async (data: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingCompany) {
      await editCompany(editingCompany.id, data);
    } else {
      await addCompany(data);
    }
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary tracking-wider">Companies</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage your corporate clients and partners.</p>
        </div>
        <Button onClick={handleAddCompany} className="mt-4 sm:mt-0 bg-primary hover:bg-yellow-400 text-black font-semibold py-3 px-6 text-base bat-glow">
          <PlusIcon className="mr-2 h-5 w-5" /> Add New Company
        </Button>
      </div>

      <Card className="border-zinc-800 bg-card backdrop-blur-sm bat-shadow">
        <CardHeader className="border-b border-zinc-800 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:max-w-xs">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800/50 border-zinc-700 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && filteredCompanies.length === 0 ? (
            <TableSkeleton rows={5} columns={4} showTableHeader={true} />
          ) : !loading && filteredCompanies.length === 0 ? (
            <div className="p-6 md:p-10">
              <EmptyStatePlaceholder 
                icon={Building2} 
                title="No Companies Found"
                description="Your company directory is empty. Add your first company to get started."
                actionText="Add First Company"
                onActionClick={handleAddCompany}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="w-[80px]"></TableHead> {/* Avatar column */}
                    <TableHead onClick={() => {}} className="cursor-pointer hover:text-primary transition-colors">
                      Company Name
                    </TableHead>
                    <TableHead onClick={() => {}} className="cursor-pointer hover:text-primary transition-colors">
                      Industry
                    </TableHead>
                    <TableHead onClick={() => {}} className="cursor-pointer hover:text-primary transition-colors">
                      Website
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id} className="border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                      <TableCell>
                        <Avatar className="h-10 w-10 border-2 border-zinc-700">
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {company.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{company.name}</TableCell>
                      <TableCell className="text-muted-foreground">{company.industry || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {company.website ? 
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline flex items-center">
                            {company.website} <Briefcase className="ml-1 h-3 w-3 opacity-70" />
                          </a> : 'N/A'}
                      </TableCell>
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
                            <DropdownMenuItem onClick={() => handleEditCompany(company)} className="cursor-pointer focus:bg-zinc-800/70 focus:text-primary">
                              <Edit3 className="mr-2 h-4 w-4 text-primary/80" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteCompany(company.id)} className="cursor-pointer focus:bg-red-500/10 text-red-500 focus:text-red-400">
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

      {isModalOpen && (
        <CompanyFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSubmitForm}
          company={editingCompany}
        />
      )}
    </div>
  );
}

export default Companies;