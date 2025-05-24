export type UserRole = 'admin' | 'manager' | 'sales' | 'support';

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  company_id: string | null;
  score: number | null;
  last_contact: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  // Joined data
  company?: Company;
}

export interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  contacts?: Contact[];
  deals?: Deal[];
}

export interface Deal {
  id: string;
  name: string;
  value: number;
  stage: 'lead' | 'prospect' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  company_id: string | null;
  owner_id: string | null;
  close_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  company?: Company;
  owner?: Profile;
  contacts?: Contact[];
}

export interface DealContact {
  deal_id: string;
  contact_id: string;
}

// Dashboard widget types
export interface DashboardWidget {
  id: string;
  type: 'deals' | 'activities' | 'contacts' | 'tasks' | 'performance' | 'calendar';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  settings?: Record<string, any>;
}

// Permission helpers
export const RolePermissions: Record<UserRole, string[]> = {
  admin: [
    'view:all',
    'create:all',
    'update:all',
    'delete:all',
    'manage:users',
    'manage:roles',
    'manage:settings'
  ],
  manager: [
    'view:all',
    'create:all',
    'update:all',
    'delete:own',
    'manage:team',
    'view:reports'
  ],
  sales: [
    'view:own',
    'create:own',
    'update:own',
    'delete:own',
    'view:team'
  ],
  support: [
    'view:own',
    'create:own',
    'update:own',
    'view:team'
  ]
};