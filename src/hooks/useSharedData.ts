import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// UPDATED FILE FETCHING HOOK
// ============================================
export function useClientFiles(clientId?: string, organizationId?: string, isClient: boolean = false) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    if (!organizationId) return;
    
    try {
      let query = supabase
        .from("client_files")
        .select("*")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      // For clients: fetch their files OR shared files
      if (isClient && clientId) {
        query = query.or(`client_id.eq.${clientId},is_shared_with_all_clients.eq.true`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [clientId, organizationId, isClient]);

  return { files, loading, refresh: fetchFiles };
}

// ============================================
// UPDATED CONTRACT FETCHING
// ============================================
export function useContracts(clientId?: string, organizationId?: string, isClient: boolean = false) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = async () => {
    if (!organizationId) return;

    try {
      let query = supabase
        .from("contracts")
        .select("*")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      // For clients: fetch their contracts OR shared contracts
      if (isClient && clientId) {
        query = query.or(`client_id.eq.${clientId},is_shared_with_all_clients.eq.true`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [clientId, organizationId, isClient]);

  return { contracts, loading, refresh: fetchContracts };
}

// ============================================
// UPDATED MEETING FETCHING
// ============================================
export function useMeetings(clientId?: string, organizationId?: string, isClient: boolean = false) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = async () => {
    if (!organizationId) return;

    try {
      let query = supabase
        .from("meetings")
        .select("*")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("scheduled_at", { ascending: true });

      // For clients: fetch their meetings OR shared meetings
      if (isClient && clientId) {
        query = query.or(`client_id.eq.${clientId},is_shared_with_all_clients.eq.true`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [clientId, organizationId, isClient]);

  return { meetings, loading, refresh: fetchMeetings };
}

// ============================================
// UPDATED INVOICE FETCHING
// ============================================
export function useInvoices(clientId?: string, organizationId?: string, isClient: boolean = false) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    if (!organizationId) return;

    try {
      let query = supabase
        .from("invoices")
        .select("*")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      // For clients: fetch their invoices OR shared invoices
      if (isClient && clientId) {
        query = query.or(`client_id.eq.${clientId},is_shared_with_all_clients.eq.true`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [clientId, organizationId, isClient]);

  return { invoices, loading, refresh: fetchInvoices };
}

// ============================================
// HELPER: Get Current User's Client ID
// ============================================
export async function getCurrentClientId(organizationId: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("clients")
    .select("id")
    .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  return data?.id || null;
}
