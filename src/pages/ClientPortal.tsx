import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FileUp, CreditCard, Calendar, MessageSquare, Building } from "lucide-react";

export default function ClientPortal() {
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      // Check for client token in localStorage
      const clientToken = localStorage.getItem("client_token");
      const clientEmail = localStorage.getItem("client_email");
      
      if (!clientToken || !clientEmail) {
        setLoading(false);
        return;
      }

      // Fetch client by token
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("access_token", clientToken)
        .eq("email", clientEmail)
        .is("deleted_at", null)
        .maybeSingle();

      if (error || !data) {
        console.error("Error loading client:", error);
        localStorage.removeItem("client_token");
        localStorage.removeItem("client_email");
        setLoading(false);
        return;
      }

      // Check if token is expired
      if (data.access_token_expires_at) {
        const expiresAt = new Date(data.access_token_expires_at);
        if (expiresAt < new Date()) {
          localStorage.removeItem("client_token");
          localStorage.removeItem("client_email");
          setLoading(false);
          return;
        }
      }

      setClient(data);
    } catch (error) {
      console.error("Error loading client:", error);
    } finally {
      setLoading(false);
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

  const statusColors = {
    active: "bg-green-500",
    "on-hold": "bg-yellow-500",
    completed: "bg-blue-500",
    cancelled: "bg-red-500",
  };

  const quickLinks = [
    { title: "Files", icon: FileUp, path: "/client-portal/files", description: "Upload and view files" },
    { title: "Contracts", icon: FileText, path: "/client-portal/contracts", description: "Review and sign contracts" },
    { title: "Billing", icon: CreditCard, path: "/client-portal/billing", description: "View invoices and payments" },
    { title: "Meetings", icon: Calendar, path: "/client-portal/meetings", description: "Upcoming meetings" },
    { title: "Feedback", icon: MessageSquare, path: "/client-portal/feedback", description: "Share your feedback" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <Card className="animate-slide-up">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-primary/10 p-3">
                  <Building className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl md:text-4xl">{client.full_name}</CardTitle>
                  <CardDescription className="text-base md:text-lg">{client.project_title || "Your Project"}</CardDescription>
                </div>
              </div>
              <Badge className={statusColors[client.project_status as keyof typeof statusColors]}>
                {client.project_status?.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Links */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <Card 
                key={link.path} 
                className="hover:shadow-strong cursor-pointer transition-all duration-200 hover:scale-[1.02] group" 
                onClick={() => navigate(link.path)}
                style={{ animationDelay: `${0.15 + index * 0.05}s` }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                      <link.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{link.title}</CardTitle>
                      <CardDescription>{link.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Welcome Guide */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="text-2xl">Getting Started</CardTitle>
            <CardDescription className="text-base">Follow these simple steps to get the most out of your portal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="flex items-start gap-4 group">
                <div className="rounded-full gradient-primary text-primary-foreground w-10 h-10 flex items-center justify-center font-bold shadow-soft group-hover:shadow-medium transition-all shrink-0">1</div>
                <div>
                  <h3 className="font-semibold text-lg">Upload Your Files</h3>
                  <p className="text-sm text-muted-foreground">Share documents and assets with your team</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="rounded-full gradient-primary text-primary-foreground w-10 h-10 flex items-center justify-center font-bold shadow-soft group-hover:shadow-medium transition-all shrink-0">2</div>
                <div>
                  <h3 className="font-semibold text-lg">Review & Sign Contracts</h3>
                  <p className="text-sm text-muted-foreground">Complete any pending agreements</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="rounded-full gradient-primary text-primary-foreground w-10 h-10 flex items-center justify-center font-bold shadow-soft group-hover:shadow-medium transition-all shrink-0">3</div>
                <div>
                  <h3 className="font-semibold text-lg">Give Feedback</h3>
                  <p className="text-sm text-muted-foreground">Share your experience and help us improve</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
