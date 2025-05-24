import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Profile, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ChevronUpIcon, ChevronDownIcon, SearchIcon, CalendarIcon, CheckIcon, XIcon } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export function Users() {
  const { profile, updateUserRole, hasPermission } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Profile | null>('last_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      filterAndSortUsers();
    }
  }, [searchQuery, sortField, sortDirection, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      setUsers(data as Profile[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let result = [...users];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        (user.first_name?.toLowerCase().includes(query) || false) ||
        (user.last_name?.toLowerCase().includes(query) || false) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
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
        
        // Compare values
        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          return sortDirection === 'asc' 
            ? fieldA.localeCompare(fieldB) 
            : fieldB.localeCompare(fieldA);
        }
        
        return 0;
      });
    }
    
    setFilteredUsers(result);
  };

  const handleSort = (field: keyof Profile) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await updateUserRole(userId, newRole);
      
      if (error) {
        throw error;
      }
      
      // Update the local state to reflect the change
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const getSortIcon = (field: keyof Profile) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUpIcon className="ml-1 h-4 w-4" /> : <ChevronDownIcon className="ml-1 h-4 w-4" />;
  };

  // Helper to get initials from name
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  // Format date to readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center p-8 max-w-md bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg">
          <XIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-zinc-400 mb-6">
            You don't have permission to view this page. Only administrators can manage users.
          </p>
          <Button 
            onClick={() => window.history.back()}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <p className="text-zinc-400 mt-2">Manage users and their roles in the system</p>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-auto">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-800 border-zinc-700 w-full"
          />
        </div>
        
        <div className="flex-shrink-0">
          <span className="text-sm text-zinc-400">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </span>
        </div>
      </div>
      
      <div className="rounded-md border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900">
            <TableRow className="hover:bg-zinc-800/50">
              <TableHead className="w-[250px]">
                <button 
                  onClick={() => handleSort('last_name')}
                  className="flex items-center font-medium"
                >
                  User {getSortIcon('last_name')}
                </button>
              </TableHead>
              <TableHead>
                <button 
                  onClick={() => handleSort('email')}
                  className="flex items-center font-medium"
                >
                  Email {getSortIcon('email')}
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <button 
                  onClick={() => handleSort('role')}
                  className="flex items-center font-medium"
                >
                  Role {getSortIcon('role')}
                </button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <button 
                  onClick={() => handleSort('created_at')}
                  className="flex items-center font-medium"
                >
                  Joined {getSortIcon('created_at')}
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="hover:bg-zinc-800/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse"></div>
                      <div className="space-y-1">
                        <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse"></div>
                        <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-5 w-16 bg-zinc-800 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-8 w-20 bg-zinc-800 rounded animate-pulse ml-auto"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <TableRow key={user.id} className="hover:bg-zinc-800/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-zinc-700">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback className="text-xs bg-yellow-500/10 text-yellow-500">
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {user.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{user.email}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant="outline"
                      className={
                        user.role === 'admin' 
                          ? 'border-red-500/50 bg-red-500/10 text-red-400'
                          : user.role === 'manager'
                          ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                          : user.role === 'sales'
                          ? 'border-green-500/50 bg-green-500/10 text-green-400'
                          : 'border-purple-500/50 bg-purple-500/10 text-purple-400'
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center text-zinc-500 text-sm">
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {formatDate(user.created_at)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                          Change Role
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.id, 'admin')}
                          className={`flex items-center gap-2 ${user.role === 'admin' ? 'bg-zinc-800 text-red-400' : ''} focus:bg-zinc-800 focus:text-white`}
                        >
                          {user.role === 'admin' && <CheckIcon className="h-4 w-4" />}
                          Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.id, 'manager')}
                          className={`flex items-center gap-2 ${user.role === 'manager' ? 'bg-zinc-800 text-blue-400' : ''} focus:bg-zinc-800 focus:text-white`}
                        >
                          {user.role === 'manager' && <CheckIcon className="h-4 w-4" />}
                          Manager
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.id, 'sales')}
                          className={`flex items-center gap-2 ${user.role === 'sales' ? 'bg-zinc-800 text-green-400' : ''} focus:bg-zinc-800 focus:text-white`}
                        >
                          {user.role === 'sales' && <CheckIcon className="h-4 w-4" />}
                          Sales
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.id, 'support')}
                          className={`flex items-center gap-2 ${user.role === 'support' ? 'bg-zinc-800 text-purple-400' : ''} focus:bg-zinc-800 focus:text-white`}
                        >
                          {user.role === 'support' && <CheckIcon className="h-4 w-4" />}
                          Support
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}