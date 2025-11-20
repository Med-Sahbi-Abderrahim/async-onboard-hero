import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Inbox, UserPlus, FilePlus, Eye, Sparkles, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrgId } from "@/hooks/useOrgId";
import { ProgressDashboard } from "@/components/progress/ProgressDashboard";
import { StatsSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function Dashboard() {
  const { profile } = useUser();
  const navigate = useNavigate();
  const orgId = useOrgId();
  const [stats, setStats] = useState({
    totalClients: 0,
    activeForms: 0,
    submissionsThisMonth: 0,
    pendingTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get user's organizations
        const { data: orgData } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", profile?.id);

        if (!orgData || orgData.length === 0) {
          setLoading(false);
          return;
        }

        const orgIds = orgData.map((o) => o.organization_id);

        // Fetch stats in parallel
        const [clientsResult, formsResult, submissionsResult, tasksResult] = await Promise.all([
          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .in("organization_id", orgIds)
            .is("deleted_at", null),

          supabase
            .from("intake_forms")
            .select("id", { count: "exact", head: true })
            .in("organization_id", orgIds)
            .eq("status", "active")
            .is("deleted_at", null),

          supabase
            .from("form_submissions")
            .select("id", { count: "exact", head: true })
            .in("organization_id", orgIds)
            .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

          supabase
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .in("organization_id", orgIds)
            .in("status", ["pending", "in_progress"])
            .is("deleted_at", null),
        ]);

        setStats({
          totalClients: clientsResult.count || 0,
          activeForms: formsResult.count || 0,
          submissionsThisMonth: submissionsResult.count || 0,
          pendingTasks: tasksResult.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.id) {
      fetchStats();
    }
  }, [profile?.id]);

  const hasNoData = stats.totalClients === 0 && stats.activeForms === 0 && stats.submissionsThisMonth === 0 && stats.pendingTasks === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Welcome back, {profile?.full_name}!
          </CardTitle>
          <CardDescription>Here's what's happening with your account today.</CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      {loading ? (
        <StatsSkeleton />
      ) : hasNoData ? (
        <EmptyState
          icon={Sparkles}
          title="Let's get started!"
          description="Invite your first client to begin collecting submissions and managing your workflow."
          action={{
            label: "Invite Your First Client",
            onClick: () => navigate(orgId ? `/clients/${orgId}` : "/clients")
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
                <p className="text-xs text-muted-foreground">Active clients in your organization</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeForms}</div>
                <p className="text-xs text-muted-foreground">Published intake forms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submissions This Month</CardTitle>
                <Inbox className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.submissionsThisMonth}</div>
                <p className="text-xs text-muted-foreground">
                  New submissions in {new Date().toLocaleDateString("en-US", { month: "long" })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingTasks}</div>
                <p className="text-xs text-muted-foreground">Tasks needing attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => navigate(orgId ? `/clients/${orgId}` : "/clients")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Client
              </Button>
              <Button variant="outline" onClick={() => navigate(orgId ? `/forms/${orgId}/create` : "/forms/create")}>
                <FilePlus className="mr-2 h-4 w-4" />
                Create Form
              </Button>
              <Button variant="outline" onClick={() => navigate(orgId ? `/submissions/${orgId}` : "/submissions")}>
                <Eye className="mr-2 h-4 w-4" />
                View Submissions
              </Button>
            </CardContent>
          </Card>

          {/* Progress Dashboard */}
          <ProgressDashboard />
        </>
      )}
    </div>
  );
}
