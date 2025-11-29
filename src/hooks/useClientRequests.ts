// ============================================
// PART 2: useClientRequests Hook
// ============================================
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClientRequest {
  id: string;
  client_id: string;
  organization_id: string;
  request_type: string;
  title: string;
  description: string | null;
  status: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export function useClientRequests(organizationId?: string) {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchRequests = async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from("client_requests")
        .select(`
          *,
          client:clients(id, full_name, email, company_name)
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRequests((data || []) as any);
      setPendingCount((data || []).filter((r) => r.status === "pending").length);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [organizationId]);

  return {
    requests,
    loading,
    pendingCount,
    refresh: fetchRequests,
  };
}
