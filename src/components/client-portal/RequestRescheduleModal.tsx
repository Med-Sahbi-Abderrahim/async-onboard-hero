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
  onSuccess 
}: RequestRescheduleModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    new_date: "",
    new_time: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("client_requests").insert({
        client_id: clientId,
        organization_id: organizationId,
        request_type: "change_request",
        title: `Reschedule: ${meetingTitle}`,
        description: formData.reason,
        status: "pending",
        metadata: {
          meeting_id: meetingId,
          new_date: formData.new_date,
          new_time: formData.new_time,
        },
      });

      if (error) throw error;

      toast({
        title: "✅ Reschedule request submitted",
        description: "Your request has been sent to the team",
      });

      setFormData({
        new_date: "",
        new_time: "",
        reason: "",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "⚠️ Failed to submit request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Reschedule</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Current Meeting</Label>
            <p className="text-sm text-muted-foreground">{meetingTitle}</p>
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
              placeholder="Optional: Let us know why you need to reschedule"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
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
