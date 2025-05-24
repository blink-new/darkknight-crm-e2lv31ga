import React from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  Calendar,
  Mail,
  CheckSquare,
  BarChart3,
  Zap,
  Settings,
  UserCircle,
  UserCog
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface SidebarProps {
  isSheet?: boolean;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isSheet?: boolean;
}

const NavItem = ({ to, icon, label, isActive, isSheet }: NavItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200 ease-in-out",
      "group",
      isActive 
        ? "bg-primary/10 text-primary font-semibold shadow-inner shadow-primary/20 bat-glow-sm"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      isSheet && "text-lg py-3"
    )}
  >
    {React.cloneElement(icon as React.ReactElement, { 
      className: cn(
        'transition-colors',
        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'
      )
    })}
    <span className={cn('transition-colors', isActive ? 'text-primary' : 'group-hover:text-sidebar-accent-foreground')}>{label}</span>
  </Link>
);

export const Sidebar = ({ isSheet }: SidebarProps) => {
  const location = useLocation();
  const { profile } = useAuth;
  
  const isActive = (path: string) => location.pathname === path || (path === '/' && location.pathname.startsWith('/dashboard'));
  
  const mainNavItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/contacts', icon: <Users size={20} />, label: 'Contacts' },
    { to: '/companies', icon: <Building2 size={20} />, label: 'Companies' },
    { to: '/deals', icon: <DollarSign size={20} />, label: 'Deals' },
  ];

  const secondaryNavItems = [
    { to: '/calendar', icon: <Calendar size={20} />, label: 'Calendar' },
    { to: '/mail', icon: <Mail size={20} />, label: 'Email' },
    { to: '/tasks', icon: <CheckSquare size={20} />, label: 'Tasks' },
  ];

  const tertiaryNavItems = [
    { to: '/reports', icon: <BarChart3 size={20} />, label: 'Reports' },
    { to: '/automation', icon: <Zap size={20} />, label: 'Automation' },
  ];

  const accountNavItems = [
    { to: '/profile', icon: <UserCircle size={20} />, label: 'Profile' },
    ...(profile?.role === 'admin' ? [{ to: '/users', icon: <UserCog size={20} />, label: 'User Management' }] : []),
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar text-sidebar-foreground",
      isSheet ? "p-0" : "w-64 border-r border-sidebar-border shadow-lg bat-shadow"
    )}>
      {isSheet && (
        <div className="p-4 border-b border-sidebar-border flex items-center justify-center">
          <Link to="/">
            <BrandLogo size={100} /> 
          </Link>
        </div>
      )}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        <nav className="grid gap-1 px-3">
          <p className="px-3 py-1 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Main</p>
          {mainNavItems.map((item) => (
            <NavItem key={item.to} {...item} isActive={isActive(item.to)} isSheet={isSheet} />
          ))}
        </nav>
        <nav className="grid gap-1 px-3">
          <p className="px-3 py-1 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Tools</p>
          {secondaryNavItems.map((item) => (
            <NavItem key={item.to} {...item} isActive={isActive(item.to)} isSheet={isSheet} />
          ))}
        </nav>
        <nav className="grid gap-1 px-3">
          <p className="px-3 py-1 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Analytics & Automation</p>
          {tertiaryNavItems.map((item) => (
            <NavItem key={item.to} {...item} isActive={isActive(item.to)} isSheet={isSheet} />
          ))}
        </nav>
      </div>
      
      <div className={cn("border-t border-sidebar-border", isSheet ? "mt-0" : "mt-auto")}>
        <nav className="grid gap-1 px-3 py-4">
          <p className="px-3 py-1 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Account</p>
          {accountNavItems.map((item) => (
            <NavItem key={item.to} {...item} isActive={isActive(item.to)} isSheet={isSheet} />
          ))}
        </nav>
      </div>
    </div>
  );
};