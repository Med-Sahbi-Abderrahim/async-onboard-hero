import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';

export interface OrganizationBranding {
  id: string;
  name: string;
  plan: string;
  branding_level: string;
  logo_url: string | null;
  brand_color: string | null;
  font_family: string | null;
  custom_font_url: string | null;
  custom_font_name: string | null;
}

interface UseOrganizationReturn {
  organization: OrganizationBranding | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useOrganization(): UseOrganizationReturn {
  const { user, session } = useAuth();
  const [organization, setOrganization] = useState<OrganizationBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrganization = async () => {
    try {
      // Wait for session to be available
      if (!session || !user?.id) {
        console.log('⏳ Waiting for session...');
        setLoading(true);
        return;
      }

      setLoading(true);
      setError(null);

      // First, get the user's organization_id from organization_members
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (memberError) {
        throw new Error(`Failed to fetch organization membership: ${memberError.message}`);
      }

      if (!memberData?.organization_id) {
        throw new Error('User is not a member of any organization');
      }

      const orgId = memberData.organization_id;
      console.log('🏢 Fetching organization:', orgId);

      // Fetch organization branding with proper Supabase client
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          plan,
          branding_level,
          logo_url,
          brand_color,
          font_family,
          custom_font_url,
          custom_font_name
        `)
        .eq('id', orgId)
        .single();

      if (orgError) {
        throw new Error(`Failed to fetch organization: ${orgError.message}`);
      }

      if (!orgData) {
        throw new Error('Organization not found');
      }

      console.log('✅ Organization fetched:', orgData.name);
      setOrganization(orgData);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching organization');
      console.error('❌ Error fetching organization:', error);
      setError(error);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [session?.access_token, user?.id]);

  return {
    organization,
    loading,
    error,
    refetch: fetchOrganization
  };
}
