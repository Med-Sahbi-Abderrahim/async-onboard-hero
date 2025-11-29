import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, User, FileText } from "lucide-react";
import { toast } from "sonner";

export default function OrganizationRequestsDashboard({ organizationId }: { organizationId: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [organizationId]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("client_requests")
        .select(`
          *,
          clients!inner(full_name, email, company_name)
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    try {
      const { error } = await supabase.functions.invoke("approve-reject-request", {
        body: {
          request_id: requestId,
          action,
          reason: action === "reject" ? rejectReason : undefined,
        },
      });

      if (error) throw error;

      toast.success(`Request ${action === "approve" ? "approved" : "rejected"} successfully`);
      setRejectingId(null);
      setRejectReason("");
      loadRequests();
    } catch (error: any) {
      console.error("Error processing request:", error);
      toast.error(error.message || "Failed to process request");
    }
  };

  const filterRequests = (status: string) => {
    if (status === "all") return requests;
    return requests.filter((req) => req.status === status);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "pending", icon: Clock },
      approved: { variant: "completed", icon: CheckCircle },
      rejected: { variant: "blocked", icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      contract: FileText,
      meeting: Clock,
      task: CheckCircle,
      file_access: FileText,
      change_request: FileText,
    };
    const Icon = icons[type] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Client Requests</h2>
        <p className="text-muted-foreground">Review and manage client requests</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({filterRequests("pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({filterRequests("approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({filterRequests("rejected").length})
          </TabsTrigger>
        </TabsList>

        {["all", "pending", "approved", "rejected"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4 mt-4">
            {filterRequests(status).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <p>No {status !== "all" ? status : ""} requests</p>
                </CardContent>
              </Card>
            ) : (
              filterRequests(status).map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="rounded-lg bg-primary/10 p-2">
                          {getTypeIcon(request.request_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg mb-1">{request.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{request.clients.full_name}</span>
                            <span>•</span>
                            <span>{new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {request.description && (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">{request.description}</p>
                      </div>
                    )}

                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAction(request.id, "approve")}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setRejectingId(request.id)}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {rejectingId === request.id && (
                      <div className="space-y-2 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                        <Textarea
                          placeholder="Provide a reason for rejection..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectReason("");
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleAction(request.id, "reject")}
                            className="flex-1"
                          >
                            Confirm Rejection
                          </Button>
                        </div>
                      </div>
                    )}

                    {request.status === "rejected" && request.metadata?.rejection_reason && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm font-medium mb-1">Rejection Reason:</p>
                        <p className="text-sm">{request.metadata.rejection_reason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
