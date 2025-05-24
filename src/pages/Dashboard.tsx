import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { UserCheck, Building, DollarSign, TrendingUp, BarChart3, ArrowUpRight, Users, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    contacts: 0,
    companies: 0,
    deals: 0,
    dealValue: 0,
  });
  const [recentDeals, setRecentDeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentDeals();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetch contact count
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      // Fetch company count
      const { count: companyCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Fetch deal count and total value
      const { data: dealData } = await supabase
        .from('deals')
        .select('value');

      const dealCount = dealData?.length || 0;
      const dealValue = dealData?.reduce((sum, deal) => sum + Number(deal.value), 0) || 0;

      setStats({
        contacts: contactCount || 0,
        companies: companyCount || 0,
        deals: dealCount,
        dealValue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentDeals = async () => {
    try {
      const { data } = await supabase
        .from('deals')
        .select(`
          *,
          company:company_id(id, name),
          owner:owner_id(id, first_name, last_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentDeals(data || []);
    } catch (error) {
      console.error('Error fetching recent deals:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  const getDealStageBadge = (stage: string) => {
    const stageColors = {
      'lead': 'bg-blue-500/10 text-blue-500',
      'prospect': 'bg-indigo-500/10 text-indigo-500',
      'proposal': 'bg-purple-500/10 text-purple-500',
      'negotiation': 'bg-orange-500/10 text-orange-500',
      'closed-won': 'bg-green-500/10 text-green-500',
      'closed-lost': 'bg-red-500/10 text-red-500',
    };
    
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${stageColors[stage as keyof typeof stageColors] || 'bg-gray-500/10 text-gray-500'}`}>
        {stage.replace('-', ' ')}
      </span>
    );
  };

  return (
    <div className="p-6 md:p-10 bg-background min-h-screen">
      <div className="mb-10 flex flex-col items-center">
        <h1 className="font-display text-5xl font-bold text-primary tracking-wider text-center">
          Welcome, {profile?.first_name || 'Agent'}
        </h1>
        <p className="text-zinc-400 mt-2 text-lg text-center">Gotham's Pulse: Your CRM Overview.</p>
      </div>

      {/* Stats cards - Enhanced Batman Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[ // Array for easier mapping
          { title: 'Total Contacts', value: stats.contacts, icon: UserCheck, color: 'blue', link: '/contacts' },
          { title: 'Total Companies', value: stats.companies, icon: Building, color: 'purple', link: '/companies' },
          { title: 'Active Deals', value: stats.deals, icon: DollarSign, color: 'yellow', link: '/deals' },
          { title: 'Total Deal Value', value: formatCurrency(stats.dealValue), icon: TrendingUp, color: 'green', link: '/reports' },
        ].map((stat, index) => (
          <Card 
            key={index} 
            className={cn(
              'border-zinc-800 bg-card backdrop-blur-sm bat-shadow transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1',
              `hover:border-primary/60`
            )}
          >
            <CardHeader className="pb-3">
              <div className={cn(
                'w-14 h-14 rounded-lg flex items-center justify-center mb-3',
                {
                  'bg-blue-500/10': stat.color === 'blue',
                  'bg-purple-500/10': stat.color === 'purple',
                  'bg-yellow-500/10': stat.color === 'yellow',
                  'bg-green-500/10': stat.color === 'green',
                }
              )}>
                <stat.icon className={cn(
                  'h-7 w-7',
                  {
                    'text-blue-400': stat.color === 'blue',
                    'text-purple-400': stat.color === 'purple',
                    'text-yellow-400': stat.color === 'yellow',
                    'text-green-400': stat.color === 'green',
                  }
                )} />
              </div>
              <CardDescription className="text-sm text-muted-foreground">{stat.title}</CardDescription>
              <CardTitle className="font-display text-4xl font-bold text-foreground">
                {isLoading ? (
                  <div className="h-10 w-20 bg-zinc-800 rounded animate-pulse"></div>
                ) : (
                  stat.value
                )}
              </CardTitle>
            </CardHeader>
            <CardFooter className="pt-0">
              <Link 
                to={stat.link} 
                className={cn(
                  'flex items-center text-sm font-medium hover:underline',
                  {
                    'text-blue-400 hover:text-blue-300': stat.color === 'blue',
                    'text-purple-400 hover:text-purple-300': stat.color === 'purple',
                    'text-yellow-400 hover:text-yellow-300': stat.color === 'yellow',
                    'text-green-400 hover:text-green-300': stat.color === 'green',
                  }
                )}
              >
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent deals - Enhanced */}
        <Card className="border-zinc-800 bg-card backdrop-blur-sm lg:col-span-2 bat-shadow">
          <CardHeader className="pb-4 border-b border-zinc-800">
            <div className="flex justify-between items-center">
              <CardTitle className="font-display text-2xl text-primary tracking-wide">Latest Intel (Recent Deals)</CardTitle>
              <Link to="/deals">
                <Button variant="link" className="text-yellow-400 hover:text-yellow-300 p-0 h-auto text-sm font-medium">
                  All Operatives <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
            <CardDescription className="text-sm text-muted-foreground">Your most recent successful missions and ongoing operations.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading && recentDeals.length === 0 ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 flex items-center gap-4 border-b border-zinc-800 last:border-0">
                  <div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse"></div>
                    <div className="h-3 w-1/2 bg-zinc-800 rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 w-20 bg-zinc-800 rounded-full animate-pulse"></div>
                </div>
              ))
            ) : !isLoading && recentDeals.length === 0 ? (
              <div className="py-10 text-center">
                <DollarSign className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
                <p className="font-display text-xl text-zinc-400 mb-1">No Active Operations</p>
                <p className="text-sm text-muted-foreground mb-4">Time to strategize your next move.</p>
                <Link to="/deals">
                  <Button variant="outline" className="text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/10 hover:text-yellow-300">
                    Launch New Operation
                  </Button>
                </Link>
              </div>
            ) : (
              recentDeals.map((deal) => (
                <div key={deal.id} className="p-4 flex items-center gap-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/30 transition-colors">
                  <Avatar className="h-10 w-10 border-2 border-zinc-700">
                    <AvatarImage src={deal.owner?.avatar_url || ''} />
                    <AvatarFallback className="text-sm bg-primary/20 text-primary font-semibold">
                      {getInitials(deal.owner?.first_name, deal.owner?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground truncate">{deal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {deal.company?.name || 'Independent Target'} • <span className="font-medium">{formatCurrency(deal.value)}</span>
                    </p>
                  </div>
                  <div>
                    {getDealStageBadge(deal.stage)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick actions - Enhanced */}
        <Card className="border-zinc-800 bg-card backdrop-blur-sm bat-shadow">
          <CardHeader className="border-b border-zinc-800 pb-4">
            <CardTitle className="font-display text-2xl text-primary tracking-wide">Batcomputer Access</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Your essential gadgets and tools.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-3">
            {[ // Array for easier mapping
              { label: 'Add New Contact', icon: Users, link: '/contacts/new' },
              { label: 'Add New Company', icon: Building, link: '/companies/new' },
              { label: 'Create New Deal', icon: DollarSign, link: '/deals/new' },
              { label: 'View Reports', icon: BarChart3, link: '/reports' },
            ].map((action, index) => (
              <Link key={index} to={action.link}>
                <Button variant="outline" className="w-full justify-start text-base py-3 border-zinc-700 hover:bg-zinc-800 hover:text-primary hover:border-primary/50 transition-all">
                  <action.icon className="mr-3 h-5 w-5 text-primary/80" />
                  {action.label}
                </Button>
              </Link>
            ))}
          </CardContent>
          <CardFooter className="border-t border-zinc-800 pt-4 mt-4">
            <Button className="w-full bg-primary hover:bg-yellow-400 text-black font-bold text-base py-3 bat-glow">
              <ArrowUpRight className="mr-2 h-5 w-5" />
              Access Mobile Bat-Link
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}