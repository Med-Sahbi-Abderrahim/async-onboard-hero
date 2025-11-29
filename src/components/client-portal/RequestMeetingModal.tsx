// ============================================
// UPDATED: src/components/client-portal/RequestMeetingModal.tsx
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

interface RequestMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  organizationId: string;
  onSuccess?: () => void;
}

export function RequestMeetingModal({
  open,
  onOpenChange,
  clientId,
  organizationId,
  onSuccess,
}: RequestMeetingModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    preferred_date: "",
    preferred_time: "",
    duration_minutes: "60",
  });

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast({
        title: "⚠️ Validation Error",
        description: "Please enter a meeting topic",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.preferred_date) {
      toast({
        title: "⚠️ Validation Error",
        description: "Please select a preferred date",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.preferred_time) {
      toast({
        title: "⚠️ Validation Error",
        description: "Please select a preferred time",
        variant: "destructive",
      });
      return false;
    }

    // Validate that selected date is not in the past
    const selectedDateTime = new Date(`${formData.preferred_date}T${formData.preferred_time}`);
    if (selectedDateTime < new Date()) {
      toast({
        title: "⚠️ Invalid Date",
        description: "Please select a future date and time",
        variant: "destructive",
      });
      return false;
    }

    const duration = parseInt(formData.duration_minutes);
    if (duration < 15 || duration > 480) {
      toast({
        title: "⚠️ Invalid Duration",
        description: "Duration must be between 15 and 480 minutes",
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
      // 1. Insert into client_requests table
      const { data: request, error: requestError } = await supabase
        .from("client_requests")
        .insert({
          client_id: clientId,
          organization_id: organizationId,
          request_type: "meeting",
          title: `Meeting Request: ${formData.title}`,
          description: formData.description || null,
          status: "pending",
          metadata: {
            preferred_date: formData.preferred_date,
            preferred_time: formData.preferred_time,
            duration_minutes: parseInt(formData.duration_minutes),
          },
        })
        .select()
        .single();

      if (requestError) {
        console.error("Error creating meeting request:", requestError);
        throw new Error(requestError.message || "Failed to create meeting request");
      }

      if (!request) {
        throw new Error("Failed to create meeting request - no data returned");
      }

      // 2. Trigger notification to organization via edge function
      try {
        await supabase.functions.invoke("send-org-notification", {
          body: {
            organizationId,
            clientId,
            requestType: "meeting",
            requestId: request.id,
            title: `Meeting Request: ${formData.title}`,
            details: {
              topic: formData.title,
              preferred_date: formData.preferred_date,
              preferred_time: formData.preferred_time,
              duration_minutes: parseInt(formData.duration_minutes),
              description: formData.description,
            },
          },
        });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        // Don't fail the entire operation if notification fails, but log it
        console.warn("Meeting request created but notification delivery may have failed");
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        preferred_date: "",
        preferred_time: "",
        duration_minutes: "60",
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
        title: "",
        description: "",
        preferred_date: "",
        preferred_time: "",
        duration_minutes: "60",
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
          <DialogTitle>Request a Meeting</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Topic *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={isSubmitting}
              placeholder="e.g., Project Review, Initial Consultation"
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground">{formData.title.length}/100 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional Details</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
              rows={3}
              placeholder="What would you like to discuss?"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{formData.description.length}/500 characters</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred_date">Preferred Date *</Label>
              <Input
                id="preferred_date"
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                disabled={isSubmitting}
                min={today}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_time">Preferred Time *</Label>
              <Input
                id="preferred_time"
                type="time"
                value={formData.preferred_time}
                onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
            <select
              id="duration_minutes"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
              <option value="150">2.5 hours</option>
              <option value="180">3 hours</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="text-blue-800">
              ℹ️ Your meeting request will be reviewed by the team. You'll receive a confirmation email once they
              schedule the meeting.
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
