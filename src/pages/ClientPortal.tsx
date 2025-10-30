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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Find client by email (since auth user ID may not match client ID)
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        console.error("No client record found for this user");
        setLoading(false);
        return;
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Building className="h-12 w-12 text-primary" />
                <div>
                  <CardTitle className="text-3xl">{client.full_name}</CardTitle>
                  <CardDescription className="text-lg">{client.project_title || "Your Project"}</CardDescription>
                </div>
              </div>
              <Badge className={statusColors[client.project_status as keyof typeof statusColors]}>
                {client.project_status?.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Links */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <Card key={link.path} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(link.path)}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <link.icon className="h-8 w-8 text-primary" />
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
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Follow these simple steps to get the most out of your portal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center font-bold">1</div>
                <div>
                  <h3 className="font-semibold">Upload Your Files</h3>
                  <p className="text-sm text-muted-foreground">Share documents and assets with your team</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center font-bold">2</div>
                <div>
                  <h3 className="font-semibold">Review & Sign Contracts</h3>
                  <p className="text-sm text-muted-foreground">Complete any pending agreements</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center font-bold">3</div>
                <div>
                  <h3 className="font-semibold">Give Feedback</h3>
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
