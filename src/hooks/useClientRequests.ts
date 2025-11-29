// ============================================
// PART 2: useClientRequests Hook
// ============================================
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ClientRequest } from "@/path/to/types";

export function useClientRequests(organizationId?: string) {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchRequests = async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from("client_requests")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRequests(data || []);
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
