import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  FileText, 
  Save, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Edit
} from "lucide-react";

interface Contract {
  id: string;
  title: string;
  description: string | null;
  workflow_status: string;
  file_path: string | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
}

interface ContractManagementProps {
  contract: Contract;
  onUpdate: () => void;
  isOrganization: boolean;
}

export function ContractManagement({ contract, onUpdate, isOrganization }: ContractManagementProps) {
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState(contract.workflow_status);

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: "Draft", color: "bg-gray-500", icon: Edit },
    pending_approval: { label: "Pending Approval", color: "bg-yellow-500", icon: Clock },
    approved: { label: "Approved", color: "bg-green-500", icon: CheckCircle },
    pending_signature: { label: "Awaiting Signature", color: "bg-blue-500", icon: Clock },
    signed: { label: "Fully Executed", color: "bg-green-600", icon: CheckCircle },
    rejected: { label: "Rejected", color: "bg-red-500", icon: XCircle },
  };

  const currentConfig = statusConfig[contract.workflow_status] || statusConfig.draft;
  const StatusIcon = currentConfig.icon;

  const handleStatusChange = async () => {
    if (newStatus === contract.workflow_status) return;

    setLoading(true);
    try {
      const updateData: any = { workflow_status: newStatus };

      // Add approval metadata
      if (newStatus === "approved") {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.approved_by = user?.id;
        updateData.approved_at = new Date().toISOString();
      }

      // Transition to pending_signature after approval
      if (newStatus === "pending_signature") {
        updateData.approved_at = updateData.approved_at || new Date().toISOString();
      }

      const { error } = await supabase
        .from("contracts")
        .update(updateData)
        .eq("id", contract.id);

      if (error) throw error;

      toast.success("Contract status updated");
      onUpdate();
    } catch (error: any) {
      console.error("Error updating contract:", error);
      toast.error(error.message || "Failed to update contract");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!contract.file_path) return;

    try {
      const { data, error } = await supabase.storage
        .from("contracts")
        .createSignedUrl(contract.file_path, 3600);

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
        toast.success("Contract opened");
      }
    } catch (error: any) {
      console.error("Error downloading contract:", error);
      toast.error("Failed to open contract");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{contract.title}</CardTitle>
              {contract.description && (
                <p className="text-sm text-muted-foreground mt-1">{contract.description}</p>
              )}
            </div>
          </div>
          <Badge className={currentConfig.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {currentConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Organization Controls */}
        {isOrganization && contract.workflow_status !== "signed" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Save as Draft</SelectItem>
                  <SelectItem value="pending_approval">Submit for Approval</SelectItem>
                  <SelectItem value="approved">Approve Contract</SelectItem>
                  <SelectItem value="pending_signature">Send for Signature</SelectItem>
                  <SelectItem value="rejected">Reject Contract</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleStatusChange} 
                disabled={loading || newStatus === contract.workflow_status}
              >
                <Save className="h-4 w-4 mr-2" />
                Update
              </Button>
            </div>

            <div className="flex gap-2">
              {contract.file_path && (
                <Button variant="outline" onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Client View */}
        {!isOrganization && (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              {contract.workflow_status === "draft" && (
                <p className="text-blue-800">This contract is being prepared by the organization.</p>
              )}
              {contract.workflow_status === "pending_approval" && (
                <p className="text-blue-800">This contract is under review by the organization.</p>
              )}
              {contract.workflow_status === "approved" && (
                <p className="text-blue-800">This contract has been approved and will be sent for signature soon.</p>
              )}
              {contract.workflow_status === "pending_signature" && (
                <p className="text-blue-800">✍️ This contract is ready for your signature!</p>
              )}
              {contract.workflow_status === "signed" && (
                <p className="text-green-800">✓ This contract is fully executed.</p>
              )}
              {contract.workflow_status === "rejected" && (
                <p className="text-red-800">This contract was rejected.</p>
              )}
            </div>

            {contract.workflow_status === "pending_signature" && contract.file_path && (
              <Button onClick={handleDownload} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                View & Sign Contract
              </Button>
            )}

            {contract.workflow_status === "signed" && contract.file_path && (
              <Button variant="outline" onClick={handleDownload} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Signed Contract
              </Button>
            )}
          </div>
        )}

        {/* Rejection Reason */}
        {contract.rejection_reason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
            <p className="text-sm text-red-700">{contract.rejection_reason}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-muted-foreground">
          Created: {new Date(contract.created_at).toLocaleDateString()}
          {contract.approved_at && (
            <> • Approved: {new Date(contract.approved_at).toLocaleDateString()}</>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
