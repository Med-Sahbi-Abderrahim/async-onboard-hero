// ============================================
// UPDATED FILE FETCHING HOOK
// ============================================
export function useClientFiles(clientId?: string, organizationId?: string, isClient: boolean = false) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    const fetchFiles = async () => {
      try {
        let query = supabase
          .from("client_files")
          .select("*")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        // For clients: fetch their files OR org-wide files
        if (isClient && clientId) {
          query = query.or(`client_id.eq.${clientId},client_id.is.null`);
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

    fetchFiles();
  }, [clientId, organizationId, isClient]);

  return { files, loading, refresh: () => fetchFiles() };
}

// ============================================
// UPDATED CONTRACT FETCHING
// ============================================
export function useContracts(clientId?: string, organizationId?: string, isClient: boolean = false) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    const fetchContracts = async () => {
      try {
        let query = supabase
          .from("contracts")
          .select("*")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        // For clients: fetch their contracts OR org-wide contracts
        if (isClient && clientId) {
          query = query.or(`client_id.eq.${clientId},client_id.is.null`);
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

    fetchContracts();
  }, [clientId, organizationId, isClient]);

  return { contracts, loading };
}

// ============================================
// UPDATED MEETING FETCHING
// ============================================
export function useMeetings(clientId?: string, organizationId?: string, isClient: boolean = false) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    const fetchMeetings = async () => {
      try {
        let query = supabase
          .from("meetings")
          .select("*")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .order("scheduled_at", { ascending: true });

        // For clients: fetch their meetings OR org-wide meetings
        if (isClient && clientId) {
          query = query.or(`client_id.eq.${clientId},client_id.is.null`);
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

    fetchMeetings();
  }, [clientId, organizationId, isClient]);

  return { meetings, loading };
}

// ============================================
// UPDATED INVOICE FETCHING
// ============================================
export function useInvoices(clientId?: string, organizationId?: string, isClient: boolean = false) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    const fetchInvoices = async () => {
      try {
        let query = supabase
          .from("invoices")
          .select("*")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        // For clients: fetch their invoices OR org-wide invoices
        if (isClient && clientId) {
          query = query.or(`client_id.eq.${clientId},client_id.is.null`);
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

    fetchInvoices();
  }, [clientId, organizationId, isClient]);

  return { invoices, loading };
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
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  return data?.id || null;
}

// ============================================
// USAGE EXAMPLE IN CLIENT PORTAL
// ============================================
import { useParams } from "react-router-dom";
import { getCurrentClientId } from "./hooks/useSharedData";

export function ClientPortalFilesPage() {
  const { orgId } = useParams();
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientId = async () => {
      if (orgId) {
        const id = await getCurrentClientId(orgId);
        setClientId(id);
        setLoading(false);
      }
    };
    fetchClientId();
  }, [orgId]);

  const { files, loading: filesLoading } = useClientFiles(
    clientId || undefined,
    orgId,
    true // isClient = true
  );

  if (loading || filesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Files</h1>
      <div className="space-y-4">
        {files.map((file) => (
          <div key={file.id} className="p-4 border rounded">
            <h3>{file.file_name}</h3>
            <p className="text-sm text-muted-foreground">
              {file.client_id 
                ? "Private to you" 
                : "Shared by organization"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
