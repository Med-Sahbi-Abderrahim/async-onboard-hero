import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, RefreshCcw } from "lucide-react";
import { useOrgId } from "@/hooks/useOrgId";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

      // Set up real-time subscriptions for automatic updates
      const tasksChannel = supabase
        .channel(`org-tasks-${orgId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasks",
            filter: `organization_id=eq.${orgId}`,
          },
          () => {
            fetchClientsProgress();
          }
        )
        .subscribe();

      const submissionsChannel = supabase
        .channel(`org-submissions-${orgId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "form_submissions",
            filter: `organization_id=eq.${orgId}`,
          },
          () => {
            fetchClientsProgress();
          }
        )
        .subscribe();

      const contractsChannel = supabase
        .channel(`org-contracts-${orgId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "contracts",
            filter: `organization_id=eq.${orgId}`,
          },
          () => {
            fetchClientsProgress();
          }
        )
        .subscribe();

      // Cleanup subscriptions
      return () => {
        supabase.removeChannel(tasksChannel);
        supabase.removeChannel(submissionsChannel);
        supabase.removeChannel(contractsChannel);
      };
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
              <CheckCircle2 className="h-4 w-4 text-completed" />
              Completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-completed">{stats.fullyCompleted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-in-progress" />
              In Progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-in-progress">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-pending" />
              Not Started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pending">{stats.notStarted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Client Progress List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Client Progress Overview</CardTitle>
              <CardDescription>Track completion status for all clients</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchClientsProgress}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No clients yet</p>
          ) : (
            <div className="space-y-4">
              {clients.map((client, index) => (
                <div
                  key={client.id}
                  className="space-y-2 p-4 rounded-lg border hover:bg-accent/5 transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{client.full_name}</span>
                        {client.overall_progress === 100 && (
                          <Badge className="bg-completed text-completed-foreground">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                        {client.overall_progress > 0 && client.overall_progress < 100 && (
                          <Badge className="bg-in-progress text-in-progress-foreground">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            In Progress
                          </Badge>
                        )}
                        {client.overall_progress === 0 && (
                          <Badge variant="outline" className="border-pending text-pending">
                            <Clock className="h-3 w-3 mr-1" />
                            Not Started
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {client.completed_count} completed • {client.pending_count} pending
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-xl font-bold tabular-nums",
                        client.overall_progress === 100 && "text-completed",
                        client.overall_progress > 0 && client.overall_progress < 100 && "text-in-progress",
                        client.overall_progress === 0 && "text-pending"
                      )}
                    >
                      {client.overall_progress}%
                    </span>
                  </div>
                  <Progress
                    value={client.overall_progress}
                    className={cn(
                      "h-2 transition-all",
                      client.overall_progress === 100 && "[&>div]:bg-completed",
                      client.overall_progress > 0 && client.overall_progress < 100 && "[&>div]:bg-in-progress",
                      client.overall_progress === 0 && "[&>div]:bg-pending"
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}