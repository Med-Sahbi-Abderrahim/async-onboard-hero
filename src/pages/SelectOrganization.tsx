import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import kenlyLogo from '@/assets/kenly-logo.png';

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  brand_color: string | null;
  role: 'owner' | 'admin' | 'member';
}

export default function SelectOrganization() {
  const { session, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        // Get session directly from Supabase to avoid timing issues
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession?.user) {
          navigate('/login');
          return;
        }

        console.log('Fetching organizations for user:', currentSession.user.id);

        // Fetch organizations user is a member of
        const { data: memberships, error: memberError } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', currentSession.user.id);

        if (memberError) {
          console.error('Error fetching memberships:', memberError);
          throw memberError;
        }

        console.log('Found memberships:', memberships);

        if (!memberships || memberships.length === 0) {
          // No organizations - show message
          toast.error('You are not a member of any organization');
          navigate('/no-organization');
          return;
        }

        // If only one organization, redirect directly
        if (memberships.length === 1) {
          const orgId = memberships[0].organization_id;
          navigate(`/dashboard/${orgId}`);
          return;
        }

        // Fetch organization details separately
        const orgIds = memberships.map(m => m.organization_id);
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name, logo_url, brand_color')
          .in('id', orgIds);

        if (orgsError) {
          console.error('Error fetching organizations:', orgsError);
          throw orgsError;
        }

        console.log('Organization details:', orgsData);

        // Map organizations with roles
        const orgs = memberships
          .map((m) => {
            const orgData = orgsData?.find(o => o.id === m.organization_id);
            return {
              id: m.organization_id,
              name: orgData?.name || 'Unnamed Organization',
              logo_url: orgData?.logo_url || null,
              brand_color: orgData?.brand_color || null,
              role: m.role,
            };
          })
          .filter((org) => org.id);

        console.log('Final organizations to display:', orgs);
        setOrganizations(orgs);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast.error('Failed to load organizations');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [navigate]);

  const handleSelectOrganization = (orgId: string) => {
    navigate(`/dashboard/${orgId}`);
  };

  if (loading || userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <img src={kenlyLogo} alt="Kenly" className="h-12 w-12 object-contain" />
            <span className="text-2xl font-bold">Kenly</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Select an Organization</h1>
          <p className="text-muted-foreground">
            You belong to multiple organizations. Choose one to continue.
          </p>
        </div>

        {/* Organizations List */}
        <div className="space-y-3">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary"
              onClick={() => handleSelectOrganization(org.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {/* Organization Logo */}
                  <div className="flex-shrink-0">
                    {org.logo_url ? (
                      <img
                        src={org.logo_url}
                        alt={org.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="h-12 w-12 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: org.brand_color || 'hsl(var(--primary))',
                        }}
                      >
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Organization Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">{org.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{org.role}</p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sign Out Button */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/login');
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
