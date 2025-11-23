import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FileUp, CreditCard, Calendar, MessageSquare, Building, CheckCircle2, ArrowLeftRight } from "lucide-react";
import { ClientProgressCard } from "@/components/progress/ClientProgressCard";
import { WelcomeModal } from "@/components/WelcomeModal";
import { useToast } from "@/hooks/use-toast";

export default function ClientPortal() {
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const { toast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasMultipleOrgs, setHasMultipleOrgs] = useState(false);

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      // Check if user is authenticated via Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Check how many organizations this client belongs to
      const { data: allClients } = await supabase
        .from("clients")
        .select("organization_id")
        .eq("user_id", user.id)
        .is("deleted_at", null);
      
      setHasMultipleOrgs((allClients?.length || 0) > 1);

      // Fetch client data using authenticated user ID and current org
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .eq("organization_id", orgId || "")
        .is("deleted_at", null)
        .single();

      if (error || !data) {
        console.error("Error loading client:", error);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      setClient(data);
      
      // Check if this is first-time user (onboarding not completed)
      const metadata = data.metadata as Record<string, any> || {};
      const hasSeenOnboarding = metadata.onboarding_completed === true;
      if (!hasSeenOnboarding) {
        setShowWelcome(true);
      }
    } catch (error) {
      console.error("Error loading client:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      // Update client metadata to mark onboarding as completed
      const currentMetadata = (client.metadata as Record<string, any>) || {};
      const { error } = await supabase
        .from("clients")
        .update({ 
          metadata: { 
            ...currentMetadata, 
            onboarding_completed: true 
          } 
        })
        .eq("id", client.id);

      if (error) throw error;

      setShowWelcome(false);
      toast({
        title: "Welcome aboard! 🚀",
        description: "You're all set to explore your client portal.",
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setShowWelcome(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Client portal access required</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-completed",
    "on-hold": "bg-pending",
    completed: "bg-in-progress",
    cancelled: "bg-blocked",
  };

  const quickLinks = [
    { title: "Files", icon: FileUp, path: `/client-portal/${client.organization_id}/files`, description: "Upload and view files" },
    { title: "Contracts", icon: FileText, path: `/client-portal/${client.organization_id}/contracts`, description: "Review and sign contracts" },
    { title: "Billing", icon: CreditCard, path: `/client-portal/${client.organization_id}/billing`, description: "View invoices and payments" },
    { title: "Meetings", icon: Calendar, path: `/client-portal/${client.organization_id}/meetings`, description: "Upcoming meetings" },
    { title: "Tasks", icon: CheckCircle2, path: `/client-portal/${client.organization_id}/tasks`, description: "View your tasks" },
    { title: "Feedback", icon: MessageSquare, path: `/client-portal/${client.organization_id}/feedback`, description: "Share your feedback" },
  ];

  return (
    <>
      <WelcomeModal 
        open={showWelcome} 
        onComplete={handleCompleteOnboarding}
        clientName={client?.full_name}
      />
      
      <div className="min-h-screen gradient-hero p-4 md:p-8 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        {/* Header with Organization Switcher */}
        {hasMultipleOrgs && (
          <div className="flex justify-end animate-slide-up">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/client-dashboard')}
              className="hover:scale-105 transition-transform"
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Switch Organization
            </Button>
          </div>
        )}
        
        {/* Hero Header Section */}
        <div className="text-center space-y-3 py-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary shadow-glow mb-4">
            <Building className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            {client.full_name}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Your secure workspace for {client.project_title || "projects"} and communication
          </p>
          <Badge className={`${statusColors[client.project_status as keyof typeof statusColors]} text-sm px-4 py-1.5 shadow-soft`}>
            {client.project_status?.toUpperCase()}
          </Badge>
        </div>

        {/* Progress Overview */}
        <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <ClientProgressCard clientId={client.id} organizationId={client.organization_id} />
        </div>

        {/* Quick Links */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickLinks.map((link, index) => (
              <Card 
                key={link.path} 
                className="hover:shadow-strong cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 group bg-card/80 backdrop-blur-sm border-primary/10" 
                onClick={() => navigate(link.path)}
                style={{ animationDelay: `${0.15 + index * 0.05}s` }}
              >
                <CardHeader className="space-y-4">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="rounded-2xl gradient-primary p-4 group-hover:shadow-glow transition-all duration-300 group-hover:scale-110">
                      <link.icon className="h-9 w-9 text-primary-foreground" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold">{link.title}</CardTitle>
                      <CardDescription className="text-sm">{link.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Welcome Guide */}
        <Card className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">Getting Started</CardTitle>
            <CardDescription className="text-base">Follow these steps to unlock the full potential of your portal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-5 group cursor-pointer hover-lift p-4 rounded-xl transition-all">
                <div className="rounded-full gradient-primary text-primary-foreground w-12 h-12 flex items-center justify-center font-bold text-lg shadow-medium group-hover:shadow-glow transition-all shrink-0">1</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-xl mb-1">Upload Your Files</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Share documents and assets with your team securely</p>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="flex items-start gap-5 group cursor-pointer hover-lift p-4 rounded-xl transition-all">
                <div className="rounded-full gradient-primary text-primary-foreground w-12 h-12 flex items-center justify-center font-bold text-lg shadow-medium group-hover:shadow-glow transition-all shrink-0">2</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-xl mb-1">Review & Sign Contracts</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Complete any pending agreements with ease</p>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="flex items-start gap-5 group cursor-pointer hover-lift p-4 rounded-xl transition-all">
                <div className="rounded-full gradient-primary text-primary-foreground w-12 h-12 flex items-center justify-center font-bold text-lg shadow-medium group-hover:shadow-glow transition-all shrink-0">3</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-xl mb-1">Give Feedback</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Share your experience and help us improve</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  );
}
