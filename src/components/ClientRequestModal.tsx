import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { handleRequestContract } from "@/lib/notifications";

interface ClientRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  organizationId: string;
  onSuccess: () => void;
}

export function ClientRequestModal({
  open,
  onOpenChange,
  clientId,
  organizationId,
  onSuccess,
}: ClientRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    request_type: "contract",
    title: "",
    description: "",
    metadata: {},
  });

  const handleSubmit = async (e) => {
    const result = await handleRequestContract({
      contractType: contractType,
      description: description,
      clientId: clientId,
      organizationId: organizationId,
    });

    if (result.success) {
      onSuccess();
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke("handle-client-request", {
        body: {
          client_id: clientId,
          organization_id: organizationId,
          request_type: formData.request_type,
          title: formData.title,
          description: formData.description,
          metadata: formData.metadata,
        },
      });

      if (error) throw error;

      toast.success("Request submitted successfully! We'll notify you when it's reviewed.");
      onOpenChange(false);
      onSuccess();

      setFormData({
        request_type: "contract",
        title: "",
        description: "",
        metadata: {},
      });
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit a Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="request_type">Request Type *</Label>
            <Select
              value={formData.request_type}
              onValueChange={(value) => setFormData({ ...formData, request_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contract">New Contract</SelectItem>
                <SelectItem value="meeting">Schedule Meeting</SelectItem>
                <SelectItem value="task">Task Request</SelectItem>
                <SelectItem value="file_access">File Access</SelectItem>
                <SelectItem value="change_request">Change Request</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of your request"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Details</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide any additional details..."
              rows={4}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="text-blue-800">
              ℹ️ Your request will be reviewed by the organization team. You'll receive a notification once it's
              processed.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
