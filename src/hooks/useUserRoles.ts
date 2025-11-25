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
          .select(`
            id,
            organization_id,
            organizations (
              id,
              name
            )
          `)
          .eq('user_id', user.id)
          .is('deleted_at', null);

        // Check if user is an organization member
        const { data: memberData } = await supabase
          .from('organization_members')
          .select(`
            organization_id,
            organizations (
              id,
              name
            )
          `)
          .eq('user_id', user.id);

        const clientOrgs = clientData?.map((c: any) => ({
          id: c.organizations.id,
          name: c.organizations.name || 'Unnamed Organization',
        })) || [];

        const businessOrgs = memberData?.map((m: any) => ({
          id: m.organizations.id,
          name: m.organizations.name || 'Unnamed Organization',
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
