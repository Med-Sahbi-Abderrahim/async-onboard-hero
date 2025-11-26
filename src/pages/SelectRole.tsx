import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Building2, User, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';

export default function SelectRole() {
  const navigate = useNavigate();
  const { setUserMode } = useUser();
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    businessOrgs: any[];
    clientOrgs: any[];
  } | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login', { replace: true });
          return;
        }

        // Get business organizations (where user is organization_member)
        const { data: businessData } = await supabase
          .from('organization_members')
          .select('organization_id, organizations(id, name)')
          .eq('user_id', session.user.id)
          .is('deleted_at', null);

        // Get client organizations (where user is a client)
        const { data: clientData } = await supabase
          .from('clients')
          .select('organization_id, organizations(id, name)')
          .eq('user_id', session.user.id)
          .is('deleted_at', null);

        setUserInfo({
          businessOrgs: businessData || [],
          clientOrgs: clientData || [],
        });
      } catch (error) {
        console.error('Error fetching user info:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your organizations',
          variant: 'destructive',
        });
        navigate('/login', { replace: true });
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const handleContinueAsBusiness = async () => {
    if (!userInfo?.businessOrgs.length) return;
    
    setLoading(true);
    try {
      setUserMode('business');
      const orgId = userInfo.businessOrgs[0].organization_id;
      
      if (userInfo.businessOrgs.length === 1) {
        navigate(`/dashboard/${orgId}`, { replace: true });
      } else {
        navigate('/select-organization', { replace: true });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to continue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsClient = async () => {
    if (!userInfo?.clientOrgs.length) return;
    
    setLoading(true);
    try {
      setUserMode('client');
      const orgId = userInfo.clientOrgs[0].organization_id;
      
      if (userInfo.clientOrgs.length === 1) {
        navigate(`/client-portal/${orgId}`, { replace: true });
      } else {
        navigate('/client-dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to continue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your roles...</p>
        </div>
      </div>
    );
  }

  // If user only has one role, redirect automatically
  const hasBusinessRole = userInfo.businessOrgs.length > 0;
  const hasClientRole = userInfo.clientOrgs.length > 0;

  useEffect(() => {
    if (!hasBusinessRole && hasClientRole) {
      setUserMode('client');
      if (userInfo.clientOrgs.length === 1) {
        navigate(`/client-portal/${userInfo.clientOrgs[0].organization_id}`, { replace: true });
      } else {
        navigate('/client-dashboard', { replace: true });
      }
    } else if (hasBusinessRole && !hasClientRole) {
      setUserMode('business');
      if (userInfo.businessOrgs.length === 1) {
        navigate(`/dashboard/${userInfo.businessOrgs[0].organization_id}`, { replace: true });
      } else {
        navigate('/select-organization', { replace: true });
      }
    }
  }, [hasBusinessRole, hasClientRole, userInfo, navigate, setUserMode]);

  // Show loading while redirecting single-role users
  if (!hasBusinessRole && hasClientRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to client portal...</p>
        </div>
      </div>
    );
  }

  if (hasBusinessRole && !hasClientRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-xl text-muted-foreground">
            You have access to multiple parts of the platform. Which would you like to access?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Business Dashboard */}
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50" onClick={handleContinueAsBusiness} role="button" tabIndex={0}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle>Business Dashboard</CardTitle>
              <CardDescription>Manage your agency and team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Access your agency dashboard to manage forms, clients, team members, and view billing information.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Manage forms and submissions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    View client information
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Team management
                  </li>
                </ul>
                <Button className="w-full mt-6" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Client Portal */}
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50" onClick={handleContinueAsClient} role="button" tabIndex={0}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <CardTitle>Client Portal</CardTitle>
              <CardDescription>View your submitted forms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Access your client portal to view and manage your form submissions and project status.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                    View form submissions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                    Track project progress
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                    View files and contracts
                  </li>
                </ul>
                <Button className="w-full mt-6" disabled={loading} variant="outline">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
