import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, ArrowRight, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClientOrganization {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_logo: string | null;
  organization_brand_color: string | null;
  project_title: string | null;
  project_status: string | null;
  last_activity_at: string | null;
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<ClientOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "User");

      // Get all client records for this user
      const { data: clientRecords, error: clientError } = await supabase
        .from("clients")
        .select("id, organization_id, project_title, project_status, last_activity_at")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("last_activity_at", { ascending: false, nullsFirst: false });

      if (clientError) throw clientError;

      if (!clientRecords || clientRecords.length === 0) {
        setOrganizations([]);
        setLoading(false);
        return;
      }

      // Get unique organization IDs
      const orgIds = [...new Set(clientRecords.map(r => r.organization_id))];

      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, logo_url, brand_color")
        .in("id", orgIds);

      if (orgError) throw orgError;

      // Create a map of organizations for quick lookup
      const orgMap = new Map(orgData?.map(org => [org.id, org]) || []);

      // Transform data
      const orgs = clientRecords.map((record) => {
        const org = orgMap.get(record.organization_id);
        return {
          id: record.id,
          organization_id: record.organization_id,
          organization_name: org?.name || "Organization",
          organization_logo: org?.logo_url,
          organization_brand_color: org?.brand_color,
          project_title: record.project_title,
          project_status: record.project_status,
          last_activity_at: record.last_activity_at,
        };
      });

      setOrganizations(orgs);

      // If only one organization, redirect directly to it
      if (orgs.length === 1) {
        navigate(`/client-portal/${orgs[0].organization_id}`, { replace: true });
      }
    } catch (error) {
      console.error("Error loading organizations:", error);
      toast({
        title: "Error",
        description: "Failed to load your organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const statusColors: Record<string, string> = {
    active: "bg-completed",
    "on-hold": "bg-pending",
    completed: "bg-in-progress",
    cancelled: "bg-blocked",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Organizations Found</CardTitle>
            <CardDescription>You don't have access to any client portals yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero p-4 md:p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 py-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary shadow-glow mb-4">
            <Building className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Welcome back, {userName}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Select an organization to access your client portal
          </p>
          <Button 
            onClick={handleSignOut} 
            variant="ghost" 
            size="sm"
            className="mt-4"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {organizations.map((org, index) => (
            <Card
              key={org.id}
              className="hover:shadow-strong cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 group bg-card/80 backdrop-blur-sm border-primary/10 animate-slide-up"
              onClick={() => navigate(`/client-portal/${org.organization_id}`)}
              style={{ 
                animationDelay: `${0.1 + index * 0.1}s`,
                borderColor: org.organization_brand_color ? `${org.organization_brand_color}20` : undefined,
              }}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {org.organization_logo ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-primary/10 group-hover:border-primary/30 transition-all">
                        <img 
                          src={org.organization_logo} 
                          alt={org.organization_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center group-hover:shadow-glow transition-all"
                        style={{
                          background: org.organization_brand_color 
                            ? `linear-gradient(135deg, ${org.organization_brand_color}, ${org.organization_brand_color}dd)`
                            : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))'
                        }}
                      >
                        <Building className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl mb-1 truncate">{org.organization_name}</CardTitle>
                      {org.project_title && (
                        <CardDescription className="text-sm truncate">{org.project_title}</CardDescription>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {org.project_status && (
                    <Badge className={`${statusColors[org.project_status]} shadow-soft`}>
                      {org.project_status.toUpperCase()}
                    </Badge>
                  )}
                  {org.last_activity_at && (
                    <p className="text-xs text-muted-foreground">
                      Last active: {new Date(org.last_activity_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="text-xl">About Your Client Portals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              You have access to {organizations.length} organization{organizations.length !== 1 ? 's' : ''}. 
              Each portal provides secure access to your files, contracts, invoices, and project updates. 
              Click on any organization above to access its dedicated portal.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
