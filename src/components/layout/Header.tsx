import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenType } from '@/hooks/useScreenType';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  Bell, 
  Search,
  LogOut,
  User,
  UserCog,
  Settings,
  Sun, // For theme toggle
  Moon // For theme toggle
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const Header = () => {
  const isMobile = useScreenType();
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false); 
  const [isDarkTheme, setIsDarkTheme] = useState(true); 

  const getInitials = () => {
    if (!profile?.first_name && !profile?.last_name) return 'U';
    return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    document.body.classList.toggle('dark');
    // Potentially save theme preference to localStorage or user profile
  };

  return (
    <header className="sticky top-0 z-30 border-b border-sidebar-border bg-background backdrop-blur-lg bat-shadow">
      <div className="flex h-28 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2 text-foreground/80 hover:text-primary">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="border-sidebar-border bg-sidebar p-0 w-72">
                <SheetHeader className="p-4 border-b border-sidebar-border">
                  <SheetTitle>
                    <Link to="/">
                      <BrandLogo size={80} />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <Sidebar isSheet />
              </SheetContent>
            </Sheet>
          )}

          {!isMobile && (
            <Link to="/" className="flex items-center group mt-6">
              <BrandLogo size={200} /> 
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}  className="text-foreground/80 hover:text-primary">
            <Search className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary">
            <Bell className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-foreground/80 hover:text-primary">
            {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-primary/50 bat-glow-sm">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.first_name || 'User'} />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold text-base">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60 mt-2 bg-card border-zinc-800 shadow-xl bat-shadow" align="end" forceMount>
              <DropdownMenuLabel className="font-normal px-3 py-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem 
                className="cursor-pointer focus:bg-zinc-800/70 focus:text-primary py-2 px-3 text-sm"
                onClick={() => navigate('/profile')}
              >
                <User className="mr-2 h-4 w-4 text-primary/80" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              {profile?.role === 'admin' && (
                <DropdownMenuItem 
                  className="cursor-pointer focus:bg-zinc-800/70 focus:text-primary py-2 px-3 text-sm"
                  onClick={() => navigate('/users')}
                >
                  <UserCog className="mr-2 h-4 w-4 text-primary/80" />
                  <span>User Management</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem 
                className="cursor-pointer focus:bg-zinc-800/70 focus:text-primary py-2 px-3 text-sm"
                onClick={() => navigate('/settings')}
              >
                <Settings className="mr-2 h-4 w-4 text-primary/80" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-border/50" />
              
              <DropdownMenuItem 
                className="cursor-pointer focus:bg-red-500/10 text-red-500 focus:text-red-400 py-2 px-3 text-sm"
                onClick={signOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};