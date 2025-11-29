import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type ContractType = Database["public"]["Enums"]["contract_type"];

const contractTypes: { value: ContractType; label: string; description: string }[] = [
  { value: "nda", label: "NDA", description: "Non-Disclosure Agreement" },
  { value: "service_agreement", label: "Service Agreement", description: "Standard service contract" },
  { value: "consulting_agreement", label: "Consulting Agreement", description: "Professional consulting terms" },
  { value: "master_service_agreement", label: "MSA", description: "Master Service Agreement" },
  { value: "sow", label: "Statement of Work", description: "Project scope and deliverables" },
  { value: "amendment", label: "Amendment", description: "Changes to existing agreement" },
  { value: "other", label: "Other", description: "Other contract type" },
];

interface ContractRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  organizationId: string;
  onSuccess: () => void;
}

export function ContractRequestModal({
  open,
  onOpenChange,
  clientId,
  organizationId,
  onSuccess,
}: ContractRequestModalProps) {
  const [contractType, setContractType] = useState<ContractType>("service_agreement");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateForm = (): boolean => {
    if (!contractType) {
      toast({
        title: "⚠️ Validation Error",
        description: "Please select a contract type",
        variant: "destructive",
      });
      return false;
    }

    // Description is optional but if provided, validate length
    if (description && description.length > 1000) {
      toast({
        title: "⚠️ Validation Error",
        description: "Description cannot exceed 1000 characters",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const contractTypeLabel = contractTypes.find((t) => t.value === contractType)?.label || contractType;

      // 1. Insert into client_requests table
      const { data: request, error: requestError } = await supabase
        .from("client_requests")
        .insert({
          client_id: clientId,
          organization_id: organizationId,
          request_type: "contract",
          title: `Contract Request: ${contractTypeLabel}`,
          description: description || null,
          status: "pending",
          metadata: {
            contract_type: contractType,
          },
        })
        .select()
        .single();

      if (requestError) {
        console.error("Error creating contract request:", requestError);
        throw new Error(requestError.message || "Failed to create contract request");
      }

      if (!request) {
        throw new Error("Failed to create contract request - no data returned");
      }

      // 2. Trigger notification to organization
      try {
        await supabase.functions.invoke("send-org-notification", {
          body: {
            organizationId,
            clientId,
            requestType: "contract",
            requestId: request.id,
            title: `Contract Request: ${contractTypeLabel}`,
            details: {
              contract_type: contractType,
              contract_type_label: contractTypeLabel,
              description: description,
            },
          },
        });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        // Don't fail the entire operation if notification fails
        console.warn("Contract request created but notification delivery may have failed");
      }

      // Reset form
      setDescription("");
      setContractType("service_agreement");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      toast({
        title: "⚠️ Failed to submit request",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      // Reset form when closing
      setDescription("");
      setContractType("service_agreement");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request a Contract</DialogTitle>
          <DialogDescription>
            Submit a request for a specific type of contract. Our team will review and prepare it for you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-type">Contract Type *</Label>
            <Select
              value={contractType}
              onValueChange={(value) => setContractType(value as ContractType)}
              disabled={loading}
            >
              <SelectTrigger id="contract-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contractTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {contractTypes.find((t) => t.value === contractType)?.description}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any specific requirements or details about the contract you need..."
              rows={4}
              disabled={loading}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">{description.length}/1000 characters</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="text-blue-800 font-medium mb-1">📋 What happens next?</p>
            <ul className="text-blue-700 text-xs space-y-1">
              <li>• Your request will be reviewed by our team</li>
              <li>• We'll prepare the contract based on your specifications</li>
              <li>• You'll receive an email when the contract is ready for review</li>
              <li>• You can sign it directly through your client portal</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
