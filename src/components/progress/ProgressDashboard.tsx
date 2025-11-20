import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { useOrgId } from "@/hooks/useOrgId";

interface ClientProgress {
  id: string;
  full_name: string;
  email: string;
  overall_progress: number;
  pending_count: number;
  completed_count: number;
}

export function ProgressDashboard() {
  const orgId = useOrgId();
  const [clients, setClients] = useState<ClientProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    fullyCompleted: 0,
    inProgress: 0,
    notStarted: 0,
  });

  useEffect(() => {
    if (orgId) {
      fetchClientsProgress();
    }
  }, [orgId]);

  const fetchClientsProgress = async () => {
    if (!orgId) return;

    try {
      // Fetch all clients for this org
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, full_name, email")
        .eq("organization_id", orgId)
        .is("deleted_at", null);

      if (!clientsData) return;

      // For each client, calculate their progress
      const progressData: ClientProgress[] = await Promise.all(
        clientsData.map(async (client) => {
          // Fetch tasks
          const { data: tasks } = await supabase
            .from("tasks")
            .select("status")
            .eq("client_id", client.id)
            .is("deleted_at", null);

          // Fetch submissions
          const { data: submissions } = await supabase
            .from("form_submissions")
            .select("status")
            .eq("client_id", client.id)
            .is("deleted_at", null);

          // Fetch contracts
          const { data: contracts } = await supabase
            .from("contracts")
            .select("status")
            .eq("client_id", client.id)
            .is("deleted_at", null);

          // Calculate completion
          const totalTasks = tasks?.length || 0;
          const completedTasks = tasks?.filter((t) => t.status === "completed").length || 0;

          const totalForms = submissions?.length || 0;
          const completedForms =
            submissions?.filter((s) => s.status === "completed" || s.status === "approved")
              .length || 0;

          const totalContracts = contracts?.length || 0;
          const signedContracts = contracts?.filter((c) => c.status === "signed").length || 0;

          const totalItems = totalTasks + totalForms + totalContracts;
          const completedItems = completedTasks + completedForms + signedContracts;

          const overallProgress =
            totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

          return {
            id: client.id,
            full_name: client.full_name || client.email,
            email: client.email,
            overall_progress: overallProgress,
            pending_count: totalItems - completedItems,
            completed_count: completedItems,
          };
        })
      );

      // Calculate stats
      const totalClients = progressData.length;
      const fullyCompleted = progressData.filter((c) => c.overall_progress === 100).length;
      const inProgress = progressData.filter(
        (c) => c.overall_progress > 0 && c.overall_progress < 100
      ).length;
      const notStarted = progressData.filter((c) => c.overall_progress === 0).length;

      setStats({ totalClients, fullyCompleted, inProgress, notStarted });
      setClients(progressData.sort((a, b) => a.overall_progress - b.overall_progress));
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.fullyCompleted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              In Progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Not Started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.notStarted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Client Progress List */}
      <Card>
        <CardHeader>
          <CardTitle>Client Progress Overview</CardTitle>
          <CardDescription>Track completion status for all clients</CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No clients yet</p>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div key={client.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{client.full_name}</span>
                        {client.overall_progress === 100 && (
                          <Badge variant="secondary" className="text-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                        {client.overall_progress === 0 && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Not Started
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {client.completed_count} completed • {client.pending_count} pending
                      </div>
                    </div>
                    <span className="text-lg font-bold">{client.overall_progress}%</span>
                  </div>
                  <Progress value={client.overall_progress} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}