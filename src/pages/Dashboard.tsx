import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Inbox, UserPlus, FilePlus, Eye } from "lucide-react";

export default function Dashboard() {
  const { profile } = useUser();
  const [stats, setStats] = useState({
    totalClients: 0,
    activeForms: 0,
    submissionsThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get user's organizations
        const { data: orgData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', profile?.id);

        if (!orgData || orgData.length === 0) {
          setLoading(false);
          return;
        }

        const orgIds = orgData.map(o => o.organization_id);

        // Fetch stats in parallel
        const [clientsResult, formsResult, submissionsResult] = await Promise.all([
          supabase
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .in('organization_id', orgIds)
            .is('deleted_at', null),
          
          supabase
            .from('intake_forms')
            .select('id', { count: 'exact', head: true })
            .in('organization_id', orgIds)
            .eq('status', 'active')
            .is('deleted_at', null),
          
          supabase
            .from('form_submissions')
            .select('id', { count: 'exact', head: true })
            .in('organization_id', orgIds)
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        ]);

        setStats({
          totalClients: clientsResult.count || 0,
          activeForms: formsResult.count || 0,
          submissionsThisMonth: submissionsResult.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.id) {
      fetchStats();
    }
  }, [profile?.id]);

  const hasNoData = stats.totalClients === 0 && stats.activeForms === 0 && stats.submissionsThisMonth === 0;

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back, {profile?.full_name}!</CardTitle>
          <CardDescription>
            Here's what's happening with your account today.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : hasNoData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-xl font-semibold mb-2">Let's get started!</h3>
            <p className="text-muted-foreground mb-6">
              Invite your first client to begin collecting submissions.
            </p>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <p className="text-xs text-muted-foreground">New submissions in {new Date().toLocaleDateString('en-US', { month: 'long' })}</p>
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
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Client
              </Button>
              <Button variant="outline">
                <FilePlus className="mr-2 h-4 w-4" />
                Create Form
              </Button>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                View Submissions
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
