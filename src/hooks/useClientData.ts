import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClientData {
  id: string;
  organization_id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  project_title: string | null;
  project_status: string | null;
  avatar_url: string | null;
  metadata: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useClientData(orgId?: string) {
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMultipleOrgs, setHasMultipleOrgs] = useState(false);

  const loadClientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Check for multiple organizations
      const { data: allClients } = await supabase
        .from("clients")
        .select("organization_id")
        .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
        .is("deleted_at", null);

      setHasMultipleOrgs((allClients?.length || 0) > 1);

      // Fetch client for current organization
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("organization_id", orgId || "")
        .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        console.error("Error loading client:", error);
        setLoading(false);
        return;
      }

      if (!data) {
        setLoading(false);
        return;
      }

      // Update user_id if not set
      if (data.user_id !== user.id) {
        const { error: updateError } = await supabase
          .from("clients")
          .update({ user_id: user.id })
          .eq("id", data.id);

        if (!updateError) {
          data.user_id = user.id;
        }
      }

      setClient(data);
    } catch (error) {
      console.error("Error loading client:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateClientMetadata = async (metadata: any) => {
    if (!client) return false;

    try {
      const { error } = await supabase
        .from("clients")
        .update({ metadata })
        .eq("id", client.id);

      if (error) throw error;

      setClient({ ...client, metadata });
      return true;
    } catch (error) {
      console.error("Error updating client metadata:", error);
      return false;
    }
  };

  useEffect(() => {
    loadClientData();
  }, [orgId]);

  return {
    client,
    loading,
    hasMultipleOrgs,
    refreshClient: loadClientData,
    updateClientMetadata,
  };
}
