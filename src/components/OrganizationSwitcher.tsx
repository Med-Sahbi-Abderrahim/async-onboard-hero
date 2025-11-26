import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { useOrgId } from '@/hooks/useOrgId';

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
}

export function OrganizationSwitcher() {
  const { session } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const currentOrgId = useOrgId();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;

    const fetchOrganizations = async () => {
      try {
        const { data: memberships, error: memberError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .is('deleted_at', null);

        if (memberError) throw memberError;
        if (!memberships) return;

        // Fetch organization details separately
        const orgIds = memberships.map(m => m.organization_id);
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name, logo_url')
          .in('id', orgIds);

        if (orgsError) throw orgsError;

        const orgs = (orgsData || [])
          .map((org: any) => ({
            id: org.id,
            name: org.name || 'Unnamed Organization',
            logo_url: org.logo_url,
          }))
          .filter((org) => org.id);

        setOrganizations(orgs);

        // Set current org
        if (currentOrgId) {
          const current = orgs.find((org) => org.id === currentOrgId);
          setCurrentOrg(current || orgs[0] || null);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [session, currentOrgId]);

  const handleSwitchOrganization = (orgId: string) => {
    // Replace current orgId in the path with the new one
    const newPath = location.pathname.replace(
      /\/[a-f0-9-]{36}/i,
      `/${orgId}`
    );
    navigate(newPath || `/dashboard/${orgId}`);
  };

  // Don't show if user has only one org or is loading
  if (loading || organizations.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 max-w-[200px]">
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{currentOrg?.name || 'Select Organization'}</span>
          <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitchOrganization(org.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="h-5 w-5 rounded object-cover flex-shrink-0"
              />
            ) : (
              <Building2 className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            )}
            <span className="truncate flex-1">{org.name}</span>
            {org.id === currentOrgId && (
              <Check className="h-4 w-4 flex-shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
