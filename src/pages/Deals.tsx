import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Deal, Profile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon, SearchIcon, FilterIcon, DollarSignIcon, CalendarIcon, ChevronUpIcon, ChevronDownIcon, MoreHorizontalIcon, User2Icon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const dealFormSchema = z.object({
  name: z.string().min(1, { message: 'Deal name is required' }),
  value: z.string().min(1, { message: 'Deal value is required' }),
  stage: z.enum(['lead', 'prospect', 'proposal', 'negotiation', 'closed-won', 'closed-lost'], {
    required_error: 'Please select a deal stage',
  }),
  company_id: z.string().optional().nullable(),
  owner_id: z.string().optional().nullable(),
  close_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

// Deal stages with colors
const dealStages = [
  { value: 'lead', label: 'Lead', color: 'bg-blue-500/10 border-blue-500/50 text-blue-400' },
  { value: 'prospect', label: 'Prospect', color: 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' },
  { value: 'proposal', label: 'Proposal', color: 'bg-purple-500/10 border-purple-500/50 text-purple-400' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-500/10 border-orange-500/50 text-orange-400' },
  { value: 'closed-won', label: 'Closed Won', color: 'bg-green-500/10 border-green-500/50 text-green-400' },
  { value: 'closed-lost', label: 'Closed Lost', color: 'bg-red-500/10 border-red-500/50 text-red-400' },
];

export function Deals() {
  const { profile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Deal>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDeal, setCurrentDeal] = useState<Deal | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const { toast } = useToast();

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: '',
      value: '',
      stage: 'lead',
      company_id: '',
      owner_id: '',
      close_date: '',
      notes: '',
    },
  });

  useEffect(() => {
    fetchDeals();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (deals.length > 0) {
      filterAndSortDeals();
    }
  }, [searchQuery, stageFilter, sortField, sortDirection, deals]);

  const fetchDeals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          company:company_id(id, name),
          owner:owner_id(id, first_name, last_name, avatar_url)
        `);
        
      if (error) {
        throw error;
      }
      
      setDeals(data as Deal[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch deals',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      setUsers(data as Profile[]);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const filterAndSortDeals = () => {
    let result = [...deals];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(deal => 
        deal.name.toLowerCase().includes(query) ||
        (deal.company?.name.toLowerCase().includes(query) || false) ||
        (deal.owner?.first_name?.toLowerCase().includes(query) || false) ||
        (deal.owner?.last_name?.toLowerCase().includes(query) || false) ||
        deal.stage.toLowerCase().includes(query)
      );
    }
    
    // Apply stage filter
    if (stageFilter) {
      result = result.filter(deal => deal.stage === stageFilter);
    }
    
    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        const fieldA = a[sortField];
        const fieldB = b[sortField];
        
        // Handle null/undefined values
        if (!fieldA && !fieldB) return 0;
        if (!fieldA) return sortDirection === 'asc' ? -1 : 1;
        if (!fieldB) return sortDirection === 'asc' ? 1 : -1;
        
        // Compare values based on their type
        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          return sortDirection === 'asc' 
            ? fieldA.localeCompare(fieldB) 
            : fieldB.localeCompare(fieldA);
        }
        
        // For numbers
        if (typeof fieldA === 'number' && typeof fieldB === 'number') {
          return sortDirection === 'asc'
            ? fieldA - fieldB
            : fieldB - fieldA;
        }
        
        return 0;
      });
    }
    
    setFilteredDeals(result);
  };

  const handleSort = (field: keyof Deal) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const openCreateDialog = () => {
    setCurrentDeal(null);
    form.reset({
      name: '',
      value: '',
      stage: 'lead',
      company_id: '',
      owner_id: profile?.id || '',
      close_date: '',
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (deal: Deal) => {
    setCurrentDeal(deal);
    form.reset({
      name: deal.name,
      value: deal.value.toString(),
      stage: deal.stage,
      company_id: deal.company_id || '',
      owner_id: deal.owner_id || '',
      close_date: deal.close_date || '',
      notes: deal.notes || '',
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: DealFormValues) => {
    try {
      const parsedData = {
        ...data,
        value: parseFloat(data.value),
      };
      
      if (currentDeal) {
        // Update existing deal
        const { error } = await supabase
          .from('deals')
          .update({
            name: parsedData.name,
            value: parsedData.value,
            stage: parsedData.stage,
            company_id: parsedData.company_id || null,
            owner_id: parsedData.owner_id || null,
            close_date: parsedData.close_date || null,
            notes: parsedData.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentDeal.id);
          
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Deal updated successfully',
        });
      } else {
        // Create new deal
        const { error } = await supabase
          .from('deals')
          .insert({
            name: parsedData.name,
            value: parsedData.value,
            stage: parsedData.stage,
            company_id: parsedData.company_id || null,
            owner_id: parsedData.owner_id || null,
            close_date: parsedData.close_date || null,
            notes: parsedData.notes || null,
          });
          
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Deal created successfully',
        });
      }
      
      setIsDialogOpen(false);
      fetchDeals(); // Refresh the list to get updated data with joins
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save deal',
        variant: 'destructive',
      });
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Remove the deal from the list
      setDeals(prev => prev.filter(deal => deal.id !== id));
      
      toast({
        title: 'Success',
        description: 'Deal deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete deal',
        variant: 'destructive',
      });
    }
  };

  const getSortIcon = (field: keyof Deal) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUpIcon className="ml-1 h-4 w-4" /> : <ChevronDownIcon className="ml-1 h-4 w-4" />;
  };

  const getDealStageBadge = (stage: string) => {
    const stageInfo = dealStages.find(s => s.value === stage);
    return (
      <Badge variant="outline" className={stageInfo?.color}>
        {stageInfo?.label || stage}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get user initials for avatar
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Deals</h1>
          <p className="text-zinc-400 mt-2">Manage your deals and sales pipeline</p>
        </div>
        
        <Button 
          onClick={openCreateDialog}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Deal
        </Button>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64 flex-shrink-0">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search deals..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-800 border-zinc-700 w-full"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select
            value={stageFilter || ''}
            onValueChange={(value) => setStageFilter(value || null)}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="" className="focus:bg-zinc-800 focus:text-white">All Stages</SelectItem>
              {dealStages.map((stage) => (
                <SelectItem 
                  key={stage.value} 
                  value={stage.value}
                  className="focus:bg-zinc-800 focus:text-white"
                >
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <span className="text-sm text-zinc-400 ml-auto sm:ml-0">
            {filteredDeals.length} {filteredDeals.length === 1 ? 'deal' : 'deals'}
          </span>
        </div>
      </div>
      
      {/* Deal cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 w-3/4 bg-zinc-800 rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-zinc-800 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-6 w-1/3 bg-zinc-800 rounded"></div>
                  <div className="h-4 w-1/2 bg-zinc-800 rounded"></div>
                  <div className="h-4 w-2/3 bg-zinc-800 rounded"></div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="h-8 w-full bg-zinc-800 rounded"></div>
              </CardFooter>
            </Card>
          ))
        ) : filteredDeals.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-8 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg">
            <div className="text-yellow-500 bg-yellow-500/10 p-3 rounded-full mb-4">
              <DollarSignIcon className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No deals found</h3>
            <p className="text-zinc-400 text-center mb-4">
              {stageFilter
                ? `No deals in the ${dealStages.find(s => s.value === stageFilter)?.label} stage`
                : searchQuery
                ? 'No deals match your search criteria'
                : 'Start building your sales pipeline by adding a deal'}
            </p>
            <Button
              onClick={openCreateDialog}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Your First Deal
            </Button>
          </div>
        ) : (
          filteredDeals.map((deal) => (
            <Card key={deal.id} className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm hover:border-zinc-700 transition-colors group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-white group-hover:text-yellow-500 transition-colors">
                      {deal.name}
                    </CardTitle>
                    {deal.company && (
                      <CardDescription className="text-zinc-400">
                        {deal.company.name}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                      <DropdownMenuItem 
                        onClick={() => openEditDialog(deal)}
                        className="focus:bg-zinc-800 focus:text-white"
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="focus:bg-zinc-800 focus:text-white"
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      <DropdownMenuItem 
                        onClick={() => deleteDeal(deal.id)}
                        className="text-red-500 focus:bg-red-950 focus:text-red-400"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 py-2">
                  <div className="flex justify-between items-center">
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(deal.value)}
                    </div>
                    <div>
                      {getDealStageBadge(deal.stage)}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center text-sm text-zinc-400">
                      <User2Icon className="mr-2 h-4 w-4 text-zinc-500" />
                      {deal.owner ? (
                        <div className="flex items-center">
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarImage src={deal.owner.avatar_url || ''} />
                            <AvatarFallback className="text-[10px] bg-yellow-500/10 text-yellow-500">
                              {getInitials(deal.owner.first_name, deal.owner.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          {deal.owner.first_name} {deal.owner.last_name}
                        </div>
                      ) : (
                        <span>Unassigned</span>
                      )}
                    </div>
                    
                    {deal.close_date && (
                      <div className="flex items-center text-sm text-zinc-400">
                        <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
                        Expected close: {formatDate(deal.close_date)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => openEditDialog(deal)}
                >
                  Manage Deal
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{currentDeal ? 'Edit Deal' : 'Add Deal'}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {currentDeal ? 'Update deal information' : 'Enter deal details below'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enterprise License Agreement"
                        {...field}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10000"
                          {...field}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {dealStages.map((stage) => (
                            <SelectItem 
                              key={stage.value} 
                              value={stage.value}
                              className="focus:bg-zinc-800 focus:text-white"
                            >
                              {stage.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Company selection will be added soon"
                          {...field}
                          value={field.value || ''}
                          disabled
                          className="bg-zinc-800 border-zinc-700 opacity-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="close_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Close Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ''}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="owner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Owner</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {users.map((user) => (
                          <SelectItem 
                            key={user.id} 
                            value={user.id}
                            className="focus:bg-zinc-800 focus:text-white"
                          >
                            {user.first_name} {user.last_name}
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes about this deal"
                        {...field}
                        value={field.value || ''}
                        className="bg-zinc-800 border-zinc-700 min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-yellow-500 hover:bg-yellow-600 text-black ml-2"
                >
                  {currentDeal ? 'Update Deal' : 'Add Deal'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}