import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskList } from "@/components/tasks/TaskList";
import { useOrgId } from "@/hooks/useOrgId";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface Client {
  id: string;
  full_name: string;
  email: string;
}

export default function Tasks() {
  const { profile } = useUser();
  const orgId = useOrgId();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      if (!profile?.id || !orgId) return;

      try {
        const { data, error } = await supabase
          .from("clients")
          .select("id, full_name, email")
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .order("full_name");

        if (error) throw error;
        setClients(data || []);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [profile?.id, orgId]);

  if (!orgId) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No organization selected"
        description="Please select an organization to view tasks."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks Management</h1>
          <p className="text-muted-foreground mt-1">Manage and track tasks across all clients</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Client Tasks
              </CardTitle>
              <CardDescription>View and manage tasks for your clients</CardDescription>
            </div>
            {clients.length > 0 && (
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filter by client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name || client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No clients yet"
              description="Create your first client to start managing tasks."
            />
          ) : selectedClient === "all" ? (
            <Tabs defaultValue={clients[0]?.id} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
                {clients.map((client) => (
                  <TabsTrigger key={client.id} value={client.id}>
                    {client.full_name || client.email}
                  </TabsTrigger>
                ))}
              </TabsList>
              {clients.map((client) => (
                <TabsContent key={client.id} value={client.id}>
                  <TaskList
                    clientId={client.id}
                    organizationId={orgId}
                    isClient={false}
                  />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <TaskList
              clientId={selectedClient}
              organizationId={orgId}
              isClient={false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
