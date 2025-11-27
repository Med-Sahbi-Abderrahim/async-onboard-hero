import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type ContractType = Database["public"]["Enums"]["contract_type"];

const contractTypes: { value: ContractType; label: string }[] = [
  { value: "nda", label: "NDA" },
  { value: "service_agreement", label: "Service Agreement" },
  { value: "consulting_agreement", label: "Consulting Agreement" },
  { value: "master_service_agreement", label: "Master Service Agreement" },
  { value: "sow", label: "Statement of Work" },
  { value: "amendment", label: "Amendment" },
  { value: "other", label: "Other" },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create a notification for the organization
      const { error } = await supabase.from("notifications").insert({
        organization_id: organizationId,
        user_id: clientId,
        type: "contract_request",
        title: "New Contract Request",
        message: `A client has requested a ${contractTypes.find((t) => t.value === contractType)?.label || contractType} contract.`,
        metadata: {
          client_id: clientId,
          contract_type: contractType,
          description: description,
        },
      });

      if (error) throw error;

      toast({
        title: "Request submitted",
        description: "Your contract request has been sent to the organization.",
      });

      onSuccess();
      setDescription("");
      setContractType("service_agreement");
    } catch (error) {
      console.error("Error submitting contract request:", error);
      toast({
        title: "Error",
        description: "Failed to submit contract request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Contract</DialogTitle>
          <DialogDescription>
            Submit a request for a new contract. The organization will be notified.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-type">Contract Type</Label>
            <Select value={contractType} onValueChange={(value) => setContractType(value as ContractType)}>
              <SelectTrigger id="contract-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contractTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional details about your contract request..."
              rows={4}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
