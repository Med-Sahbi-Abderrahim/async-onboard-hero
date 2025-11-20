import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OrgLimits {
  organizationId: string;
  plan: 'free' | 'starter' | 'pro';
  maxPortals: number;
  maxStorageGB: number;
  storageUsedBytes: number;
  clientCount: number;
  features: {
    custom_branding: boolean;
    automations: boolean;
    integrations: boolean;
    white_label: boolean;
    priority_support: boolean;
  };
}

export function useOrgLimits(organizationId?: string) {
  const [limits, setLimits] = useState<OrgLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      fetchLimits(organizationId);
    }
  }, [organizationId]);

  const fetchLimits = async (orgId: string) => {
    try {
      // Get organization details
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, plan, max_portals, max_storage_gb, storage_used_bytes, features')
        .eq('id', orgId)
        .single();

      if (orgError) throw orgError;

      // Get client count
      const { count, error: countError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null);

      if (countError) throw countError;

      setLimits({
        organizationId: org.id,
        plan: org.plan as 'free' | 'starter' | 'pro',
        maxPortals: org.max_portals,
        maxStorageGB: org.max_storage_gb,
        storageUsedBytes: org.storage_used_bytes,
        clientCount: count || 0,
        features: org.features as {
          custom_branding: boolean;
          automations: boolean;
          integrations: boolean;
          white_label: boolean;
          priority_support: boolean;
        },
      });
    } catch (error) {
      console.error('Error fetching org limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCreateClient = () => {
    if (!limits) return false;
    return limits.clientCount < limits.maxPortals;
  };

  const canUploadFile = (fileSizeBytes: number) => {
    if (!limits) return false;
    const storageUsedGB = limits.storageUsedBytes / (1024 * 1024 * 1024);
    const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);
    return (storageUsedGB + fileSizeGB) <= limits.maxStorageGB;
  };

  const getStorageUsedGB = () => {
    if (!limits) return 0;
    return limits.storageUsedBytes / (1024 * 1024 * 1024);
  };

  const refresh = () => {
    if (organizationId) {
      fetchLimits(organizationId);
    }
  };

  return {
    limits,
    loading,
    canCreateClient,
    canUploadFile,
    getStorageUsedGB,
    refresh,
  };
}
