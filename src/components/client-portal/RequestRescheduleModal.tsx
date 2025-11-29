// ============================================
// UPDATED: src/components/client-portal/RequestRescheduleModal.tsx
// ============================================
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface RequestRescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  meetingTitle: string;
  clientId: string;
  organizationId: string;
  onSuccess?: () => void;
}

export function RequestRescheduleModal({
  open,
  onOpenChange,
  meetingId,
  meetingTitle,
  clientId,
  organizationId,
  onSuccess,
}: RequestRescheduleModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    new_date: "",
    new_time: "",
    reason: "",
  });

  const validateForm = (): boolean => {
    if (!formData.new_date) {
      toast({
        title: "⚠️ Validation Error",
        description: "Please select a new date",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.new_time) {
      toast({
        title: "⚠️ Validation Error",
        description: "Please select a new time",
        variant: "destructive",
      });
      return false;
    }

    // Validate that selected date is not in the past
    const selectedDateTime = new Date(`${formData.new_date}T${formData.new_time}`);
    if (selectedDateTime < new Date()) {
      toast({
        title: "⚠️ Invalid Date",
        description: "Please select a future date and time",
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

    setIsSubmitting(true);

    try {
      // 1. Insert reschedule request into client_requests
      const { data: request, error: requestError } = await supabase
        .from("client_requests")
        .insert({
          client_id: clientId,
          organization_id: organizationId,
          request_type: "change_request",
          title: `Reschedule Request: ${meetingTitle}`,
          description: formData.reason || null,
          status: "pending",
          metadata: {
            meeting_id: meetingId,
            new_date: formData.new_date,
            new_time: formData.new_time,
            request_type_detail: "reschedule",
          },
        })
        .select()
        .single();

      if (requestError) {
        console.error("Error creating reschedule request:", requestError);
        throw new Error(requestError.message || "Failed to create reschedule request");
      }

      if (!request) {
        throw new Error("Failed to create reschedule request - no data returned");
      }

      // 2. Trigger notification to organization
      try {
        await supabase.functions.invoke("send-org-notification", {
          body: {
            organizationId,
            clientId,
            requestType: "change_request",
            requestId: request.id,
            title: `Reschedule Request: ${meetingTitle}`,
            details: {
              meeting_id: meetingId,
              meeting_title: meetingTitle,
              new_date: formData.new_date,
              new_time: formData.new_time,
              reason: formData.reason,
            },
          },
        });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        // Don't fail the entire operation if notification fails
        console.warn("Reschedule request created but notification delivery may have failed");
      }

      // Reset form
      setFormData({
        new_date: "",
        new_time: "",
        reason: "",
      });

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      toast({
        title: "⚠️ Failed to submit request",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Reset form when closing
      setFormData({
        new_date: "",
        new_time: "",
        reason: "",
      });
    }
    onOpenChange(newOpen);
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Reschedule</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Current Meeting</Label>
            <div className="p-3 bg-muted/30 rounded-lg border border-muted">
              <p className="text-sm font-medium text-foreground">{meetingTitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new_date">Preferred New Date *</Label>
              <Input
                id="new_date"
                type="date"
                value={formData.new_date}
                onChange={(e) => setFormData({ ...formData, new_date: e.target.value })}
                disabled={isSubmitting}
                min={today}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_time">Preferred New Time *</Label>
              <Input
                id="new_time"
                type="time"
                value={formData.new_time}
                onChange={(e) => setFormData({ ...formData, new_time: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Reschedule</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              disabled={isSubmitting}
              rows={3}
              placeholder="Let us know why you need to reschedule (optional)"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">{formData.reason.length}/300 characters</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="text-blue-800">
              ℹ️ Your reschedule request will be reviewed by the team. They'll confirm your new meeting time via email.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
