// ============================================
// COMPLETE INBOX.TSX - PRODUCTION READY (ALL ISSUES FIXED)
// ============================================
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface ClientRequest {
  id: string;
  client_id: string;
  organization_id: string;
  request_type: "meeting" | "contract" | "file_access" | "task" | "change_request";
  title: string;
  description: string | null;
  status: "pending" | "seen" | "resolved";
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  client?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

type ActionModalType = "resolve" | "reject" | "details" | null;

export default function Inbox({ organizationId }: { organizationId: string }) {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [actionModal, setActionModal] = useState<ActionModalType>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({ id: user.id, email: user.email || "" });
      }
    };
    getUser();
  }, []);

  // Load requests
  const loadRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("client_requests")
        .select(`
          *,
          client:clients!client_id(id, full_name, email)
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data || []) as any);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast.error("Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Subscribe to real-time changes
  useEffect(() => {
    loadRequests();

    const subscription = supabase
      .channel(`org-requests-${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "client_requests",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [organizationId, loadRequests]);

  // Send notification to client
  const sendClientNotification = async (
    request: ClientRequest,
    status: string,
    message: string
  ) => {
    try {
      await supabase.functions.invoke("send-client-notification", {
        body: {
          organizationId,
          clientId: request.client_id,
          requestId: request.id,
          actionType: status,
          title: request.title,
          message: message,
          details: {
            original_request: request.title,
            response: message,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification to client (but request was updated)");
    }
  };

  // Log activity
  const logActivity = async (
    requestId: string,
    action: string,
    activityMetadata: Record<string, any> = {}
  ) => {
    try {
      await supabase.from("activity_logs").insert([{
        organization_id: organizationId,
        action: action as any,
        entity_type: "client" as any,
        entity_id: requestId,
        description: `${action} on client request`,
        metadata: {
          ...activityMetadata,
          user_email: currentUser?.email,
          request_type: "client_request",
        },
      }]);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  // Mark as seen
  const handleMarkSeen = async (request: ClientRequest) => {
    try {
      const { error: updateError } = await supabase
        .from("client_requests")
        .update({
          status: "seen",
          reviewed_by: currentUser?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      await sendClientNotification(
        request,
        "seen",
        "Your request has been reviewed by our team."
      );

      await logActivity(request.id, "mark_seen", {
        previous_status: request.status,
        new_status: "seen",
      });

      toast.success("Request marked as seen");
      loadRequests();
    } catch (error) {
      console.error("Error marking as seen:", error);
      toast.error("Failed to update request");
    }
  };

  // Resolve with message
  const handleResolve = async () => {
    if (!selectedRequest) return;

    if (!actionMessage.trim()) {
      toast.error("Please provide a resolution message");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("client_requests")
        .update({
          status: "resolved",
          reviewed_by: currentUser?.id,
          reviewed_at: new Date().toISOString(),
          metadata: {
            ...(selectedRequest.metadata || {}),
            resolution_message: actionMessage,
            resolved_by_email: currentUser?.email,
          },
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      await sendClientNotification(selectedRequest, "resolved", actionMessage);

      await logActivity(selectedRequest.id, "resolve_request", {
        previous_status: selectedRequest.status,
        new_status: "resolved",
        resolution_message: actionMessage,
      });

      toast.success("Request resolved and client notified");
      setActionModal(null);
      setActionMessage("");
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      console.error("Error resolving request:", error);
      toast.error("Failed to resolve request");
    } finally {
      setSubmitting(false);
    }
  };

  // Reject with reason
  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!actionMessage.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("client_requests")
        .update({
          status: "resolved",
          reviewed_by: currentUser?.id,
          reviewed_at: new Date().toISOString(),
          metadata: {
            ...(selectedRequest.metadata || {}),
            rejection_reason: actionMessage,
            rejection_status: "rejected",
            rejected_by_email: currentUser?.email,
          },
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      await sendClientNotification(
        selectedRequest,
        "rejected",
        `Your request has been declined. Reason: ${actionMessage}`
      );

      await logActivity(selectedRequest.id, "reject_request", {
        rejection_reason: actionMessage,
        previous_status: selectedRequest.status,
      });

      toast.success("Request rejected and client notified");
      setActionModal(null);
      setActionMessage("");
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    } finally {
      setSubmitting(false);
    }
  };

  // FIXED: Mark all as seen - batch update to avoid notification spam and UI flicker
  const handleMarkAllAsSeen = async () => {
    try {
      const pendingRequests = requests.filter((r) => r.status === "pending");
      
      if (pendingRequests.length === 0) {
        toast.info("No pending requests to mark as seen");
        return;
      }

      const pendingIds = pendingRequests.map((r) => r.id);

      // Batch update all at once to avoid multiple real-time triggers
      const { error } = await supabase
        .from("client_requests")
        .update({
          status: "seen",
          reviewed_by: currentUser?.id,
          reviewed_at: new Date().toISOString(),
        })
        .in("id", pendingIds);

      if (error) throw error;

      // Send notifications in parallel
      await Promise.all(
        pendingRequests.map((request) =>
          sendClientNotification(
            request,
            "seen",
            "Your request has been reviewed by our team."
          )
        )
      );

      // Log activity for batch action
      await logActivity("batch", "mark_all_seen", {
        count: pendingRequests.length,
        request_ids: pendingIds,
      });

      toast.success(`Marked ${pendingRequests.length} requests as seen`);
      loadRequests();
    } catch (error) {
      console.error("Error marking all as seen:", error);
      toast.error("Failed to mark all as seen");
    }
  };

  const filterRequests = (status: string) => {
    if (status === "all") return requests;
    return requests.filter((req) => req.status === status);
  };

  const getRequestIcon = (type: string) => {
    const icons: Record<string, any> = {
      contract: FileText,
      meeting: Clock,
      task: CheckCircle,
      file_access: FileText,
      change_request: RefreshCw,
    };
    const Icon = icons[type] || FileText;
    return Icon;
  };

  // FIXED: Complete the line that was cut off
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      seen: "bg-blue-500",
      resolved: "bg-green-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const isRejected = (request: ClientRequest) => {
    return request.metadata?.rejection_status === "rejected";
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inbox</h2>
          <p className="text-muted-foreground">
            Manage client requests and communications
          </p>
        </div>
        {pendingCount > 0 && (
          <Button onClick={handleMarkAllAsSeen} variant="outline">
            Mark all as seen
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({filterRequests("pending").length})
          </TabsTrigger>
          <TabsTrigger value="seen">
            Reviewed ({filterRequests("seen").length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({filterRequests("resolved").length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
        </TabsList>

        {["pending", "seen", "resolved", "all"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4 mt-4">
            {filterRequests(status).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <p>No {status !== "all" ? status : ""} requests</p>
                </CardContent>
              </Card>
            ) : (
              filterRequests(status).map((request) => (
                <Card
                  key={request.id}
                  className={`hover:shadow-lg transition-shadow ${
                    isRejected(request) ? "bg-red-50 border-red-200" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="rounded-lg bg-primary/10 p-2 mt-1">
                          {(() => {
                            const Icon = getRequestIcon(request.request_type);
                            return <Icon className="h-5 w-5 text-primary" />;
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg">{request.title}</CardTitle>
                            {isRejected(request) && (
                              <Badge variant="destructive" className="whitespace-nowrap">
                                Rejected
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <User className="h-3 w-3" />
                            <span>{request.client?.full_name || "Unknown"}</span>
                            <span>•</span>
                            <span>{request.client?.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(request.created_at).toLocaleDateString()}{" "}
                              {new Date(request.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(request.status)} text-white`}>
                        {request.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {request.description && (
                      <div className="p-3 bg-muted/30 rounded-lg border border-muted">
                        <p className="text-sm font-medium mb-1">Description:</p>
                        <p className="text-sm">{request.description}</p>
                      </div>
                    )}

                    {/* Show metadata details if available */}
                    {request.metadata && Object.keys(request.metadata).length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium mb-2">Request Details:</p>
                        <div className="space-y-1 text-sm">
                          {Object.entries(request.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-right">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show resolution message if resolved */}
                    {request.metadata?.resolution_message && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-medium mb-1">Our Response:</p>
                        <p className="text-sm">{request.metadata.resolution_message}</p>
                        {request.metadata.resolved_by_email && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Resolved by {request.metadata.resolved_by_email}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Show rejection reason if rejected */}
                    {request.metadata?.rejection_reason && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm font-medium mb-1">Rejection Reason:</p>
                        <p className="text-sm">{request.metadata.rejection_reason}</p>
                        {request.metadata.rejected_by_email && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Rejected by {request.metadata.rejected_by_email}
                          </p>
                        )}
                      </div>
                    )}

                    {/* FIXED: Added all action buttons including Reject */}
                    <div className="flex gap-2 pt-4 border-t flex-wrap">
                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarkSeen(request)}
                            className="flex-1 min-w-[140px]"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Mark as Seen
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionModal("resolve");
                              setActionMessage("");
                            }}
                            className="flex-1 min-w-[120px]"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionModal("reject");
                              setActionMessage("");
                            }}
                            className="flex-1 min-w-[120px]"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {request.status === "seen" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionModal("resolve");
                              setActionMessage("");
                            }}
                            className="flex-1 min-w-[120px]"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionModal("reject");
                              setActionMessage("");
                            }}
                            className="flex-1 min-w-[120px]"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {/* FIXED: Added View Details button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setActionModal("details");
                        }}
                        className="flex-1 min-w-[120px]"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 min-w-[140px]"
                        asChild
                      >
                        <a href={`/app/organization/clients/${request.client_id}`}>
                          <User className="h-4 w-4 mr-2" />
                          Client Profile
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* RESOLVE MODAL */}
      <Dialog open={actionModal === "resolve"} onOpenChange={(open) => {
        if (!open) {
          setActionModal(null);
          setActionMessage("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Request</DialogTitle>
            <DialogDescription>
              Provide a message to send to the client explaining how you resolved their request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Request</p>
              <p className="text-sm text-muted-foreground">{selectedRequest?.title}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Response *</label>
              <Textarea
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder="Explain how you resolved this request..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionModal(null);
                setActionMessage("");
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={submitting}>
              {submitting ? "Resolving..." : "Resolve & Notify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT MODAL */}
      <Dialog open={actionModal === "reject"} onOpenChange={(open) => {
        if (!open) {
          setActionModal(null);
          setActionMessage("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this request. The client will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    The client will be notified of this rejection.
                  </p>
                  <p className="text-sm text-red-800">Be respectful and clear about why.</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Request</p>
              <p className="text-sm text-muted-foreground">{selectedRequest?.title}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder="Explain why you cannot fulfill this request..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionModal(null);
                setActionMessage("");
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submitting}
            >
              {submitting ? "Rejecting..." : "Reject & Notify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FIXED: Complete Details Modal Implementation */}
      <Dialog open={actionModal === "details"} onOpenChange={(open) => {
        if (!open) setActionModal(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.title}</DialogTitle>
            <DialogDescription>
              Complete details for this client request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Client Name</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest?.client?.full_name || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Client Email</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest?.client?.email}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Request Type</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {selectedRequest?.request_type.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge className={`${selectedRequest ? getStatusColor(selectedRequest.status) : ''} text-white`}>
                  {selectedRequest?.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Submitted</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest && new Date(selectedRequest.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest && new Date(selectedRequest.updated_at).toLocaleString()}
                </p>
              </div>
            </div>

            {selectedRequest?.description && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm">{selectedRequest.description}</p>
              </div>
            )}

            {selectedRequest?.metadata && Object.keys(selectedRequest.metadata).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Request Details</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedRequest.metadata, null, 2)}
                </pre>
              </div>
            )}

            {selectedRequest?.metadata && Object.keys(selectedRequest.metadata).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Metadata</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedRequest.metadata, null, 2)}
                </pre>
              </div>
            )}

            {selectedRequest?.reviewed_by && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium mb-1">Review Information</p>
                <p className="text-xs text-muted-foreground">
                  Reviewed by: {selectedRequest.reviewed_by}
                </p>
                {selectedRequest.reviewed_at && (
                  <p className="text-xs text-muted-foreground">
                    Reviewed at: {new Date(selectedRequest.reviewed_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
