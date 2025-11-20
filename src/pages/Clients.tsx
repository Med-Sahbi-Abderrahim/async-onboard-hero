import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateClientModal } from '@/components/CreateClientModal';
import { ShareLinkModal } from '@/components/ShareLinkModal';
import { ImportClientsModal } from '@/components/clients/ImportClientsModal';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, FileDown, FileUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface Client {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  status: string;
  last_activity_at: string | null;
  created_at: string;
  tags?: string[];
}

export default function Clients() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newClient, setNewClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [organizationId, setOrganizationId] = useState<string>('');
  const itemsPerPage = 20;

  useEffect(() => {
    fetchClients();
  }, [user]);

  useEffect(() => {
    filterClients();
  }, [searchQuery, clients]);

  const fetchClients = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's organization
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!memberData) return;

      setOrganizationId(memberData.organization_id);

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', memberData.organization_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    if (filteredClients.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no clients to export",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare data for export
      const exportData = filteredClients.map((client) => ({
        "Full Name": client.full_name || "",
        Email: client.email,
        Phone: client.phone || "",
        Company: client.company_name || "",
        Status: client.status,
        Tags: client.tags?.join(", ") || "",
        "Last Activity": client.last_activity_at
          ? new Date(client.last_activity_at).toLocaleString()
          : "Never",
        "Created At": new Date(client.created_at).toLocaleString(),
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const maxWidth = 50;
      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.min(
          Math.max(
            key.length,
            ...exportData.map((row) => String(row[key as keyof typeof row] || "").length)
          ),
          maxWidth
        ),
      }));
      worksheet["!cols"] = colWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `clients_export_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export successful",
        description: `Exported ${filteredClients.length} clients to ${filename}`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export clients",
        variant: "destructive",
      });
    }
  };

  const filterClients = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.full_name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.company_name?.toLowerCase().includes(query)
    );
    setFilteredClients(filtered);
  };

  const handleClientCreated = (client: Client) => {
    setNewClient(client);
    setIsCreateModalOpen(false);
    setIsShareModalOpen(true);
    fetchClients();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastActivity = (date: string | null) => {
    if (!date) return 'Never';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Clients</h2>
          <p className="text-muted-foreground mt-2">Manage and invite your clients</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExportToExcel} disabled={clients.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Client
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No clients match your search.' : 'Invite your first client to get started.'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Client
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                          {getInitials(client.full_name || client.email)}
                        </div>
                        <div>
                          <div className="font-medium">{client.full_name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.company_name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatLastActivity(client.last_activity_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${organizationId}/${client.id}`)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <CreateClientModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onClientCreated={handleClientCreated}
      />

      <ImportClientsModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        organizationId={organizationId}
        userId={user?.id || ''}
        onImportComplete={fetchClients}
      />

      {newClient && (
        <ShareLinkModal
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          client={newClient}
        />
      )}
    </div>
  );
}
