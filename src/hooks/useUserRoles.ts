import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';

interface UserRoles {
  isClient: boolean;
  isBusinessMember: boolean;
  clientOrganizations: Array<{ id: string; name: string }>;
  businessOrganizations: Array<{ id: string; name: string }>;
  loading: boolean;
}

export function useUserRoles(): UserRoles {
  const { user } = useUser();
  const [roles, setRoles] = useState<UserRoles>({
    isClient: false,
    isBusinessMember: false,
    clientOrganizations: [],
    businessOrganizations: [],
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setRoles({
        isClient: false,
        isBusinessMember: false,
        clientOrganizations: [],
        businessOrganizations: [],
        loading: false,
      });
      return;
    }

    const fetchRoles = async () => {
      try {
        // Check if user is a client
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, organization_id')
          .eq('user_id', user.id)
          .is('deleted_at', null);

        // Check if user is an organization member
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id);

        // Fetch organization details separately to avoid RLS issues
        const clientOrgIds = clientData?.map(c => c.organization_id) || [];
        const memberOrgIds = memberData?.map(m => m.organization_id) || [];
        const allOrgIds = [...new Set([...clientOrgIds, ...memberOrgIds])];

        let orgNames: Record<string, string> = {};
        if (allOrgIds.length > 0) {
          const { data: orgsData } = await supabase
            .from('organizations')
            .select('id, name')
            .in('id', allOrgIds);
          
          orgNames = (orgsData || []).reduce((acc: Record<string, string>, org) => {
            acc[org.id] = org.name || 'Unnamed Organization';
            return acc;
          }, {});
        }

        const clientOrgs = clientData?.map((c: any) => ({
          id: c.organization_id,
          name: orgNames[c.organization_id] || 'Unnamed Organization',
        })) || [];

        const businessOrgs = memberData?.map((m: any) => ({
          id: m.organization_id,
          name: orgNames[m.organization_id] || 'Unnamed Organization',
        })) || [];

        setRoles({
          isClient: clientOrgs.length > 0,
          isBusinessMember: businessOrgs.length > 0,
          clientOrganizations: clientOrgs,
          businessOrganizations: businessOrgs,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching user roles:', error);
        setRoles({
          isClient: false,
          isBusinessMember: false,
          clientOrganizations: [],
          businessOrganizations: [],
          loading: false,
        });
      }
    };

    fetchRoles();
  }, [user]);

  return roles;
}
