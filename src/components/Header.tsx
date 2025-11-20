import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { ThemeToggle } from '@/components/theme-toggle';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrgId } from '@/hooks/useOrgId';
import { Building2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
}

const getPageTitle = (pathname: string): string => {
  // Remove orgId from path for title matching
  const pathWithoutOrgId = pathname.replace(/\/[^/]+\/([a-f0-9-]{36})/i, '/$1');
  
  if (pathWithoutOrgId.includes('/dashboard')) return 'Dashboard';
  if (pathWithoutOrgId.includes('/clients')) return 'Clients';
  if (pathWithoutOrgId.includes('/forms')) return 'Forms';
  if (pathWithoutOrgId.includes('/submissions')) return 'Submissions';
  if (pathWithoutOrgId.includes('/settings')) return 'Settings';
  if (pathWithoutOrgId.includes('/billing')) return 'Billing';
  if (pathWithoutOrgId.includes('/reminders')) return 'Reminders';
  
  return 'Dashboard';
};

export function Header() {
  const { profile, session } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const currentOrgId = useOrgId();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  const pageTitle = getPageTitle(location.pathname);

  // Fetch user's organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!session?.user?.id) return;
      
      setLoadingOrgs(true);
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id);

        if (error) throw error;

        // Fetch organization details
        const orgIds = data?.map(item => item.organization_id) || [];
        
        if (orgIds.length === 0) {
          setOrganizations([]);
          setLoadingOrgs(false);
          return;
        }

        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);

        if (orgsError) throw orgsError;

        const orgs = orgsData?.map(org => ({ 
          id: org.id, 
          name: org.name || 'Unnamed Organization' 
        })) || [];

        setOrganizations(orgs);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, [session?.user?.id]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
      navigate('/login');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleOrgChange = (newOrgId: string) => {
    if (!currentOrgId) return;
    
    // Replace orgId in current path
    const newPath = location.pathname.replace(`/${currentOrgId}`, `/${newOrgId}`);
    navigate(newPath);
  };

  const currentOrg = organizations.find(org => org.id === currentOrgId);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        <SidebarTrigger />
        
        <h1 className="text-2xl font-semibold">{pageTitle}</h1>

        <div className="ml-auto flex items-center gap-2">
          {/* Organization Selector */}
          {organizations.length > 1 && currentOrgId && (
            <Select value={currentOrgId} onValueChange={handleOrgChange} disabled={loadingOrgs}>
              <SelectTrigger className="w-[200px]">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <SelectValue placeholder="Select organization" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <ThemeToggle />
          <NotificationsDropdown />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                  <AvatarFallback>
                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.full_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(currentOrgId ? `/settings/${currentOrgId}/profile` : '/settings/profile')}>
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(currentOrgId ? `/settings/${currentOrgId}/organization` : '/settings/organization')}>
                Organization Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(currentOrgId ? `/billing/${currentOrgId}` : '/billing')}>
                Billing & Subscription
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
