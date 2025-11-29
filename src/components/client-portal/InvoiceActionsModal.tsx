import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, HelpCircle } from "lucide-react";

interface InvoiceActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  organizationId: string;
  onSuccess?: () => void;
}

export function InvoiceActionsModal({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  clientId,
  organizationId,
  onSuccess,
}: InvoiceActionsModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<"question" | "dispute" | null>(null);
  const [message, setMessage] = useState("");

  const validateForm = (): boolean => {
    if (!actionType) {
      toast({
        title: "⚠️ Validation Error",
        description: "Please select an action type",
        variant: "destructive",
      });
      return false;
    }

    if (!message.trim()) {
      toast({
        title: "⚠️ Validation Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return false;
    }

    if (message.length > 1000) {
      toast({
        title: "⚠️ Validation Error",
        description: "Message cannot exceed 1000 characters",
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
      const requestTitle =
        actionType === "question" ? `Invoice Question: #${invoiceNumber}` : `Invoice Dispute: #${invoiceNumber}`;

      // 1. Insert into client_requests table
      const { data: request, error: requestError } = await supabase
        .from("client_requests")
        .insert({
          client_id: clientId,
          organization_id: organizationId,
          request_type: "change_request",
          title: requestTitle,
          description: message,
          status: "pending",
          metadata: {
            invoice_id: invoiceId,
            invoice_number: invoiceNumber,
            action_type: actionType,
            request_type_detail: actionType,
          },
        })
        .select()
        .single();

      if (requestError) {
        console.error("Error creating invoice action request:", requestError);
        throw new Error(requestError.message || "Failed to submit request");
      }

      if (!request) {
        throw new Error("Failed to create request - no data returned");
      }

      // 2. Trigger notification to organization
      try {
        await supabase.functions.invoke("send-org-notification", {
          body: {
            organizationId,
            clientId,
            requestType: "change_request",
            requestId: request.id,
            title: requestTitle,
            details: {
              invoice_id: invoiceId,
              invoice_number: invoiceNumber,
              action_type: actionType,
              message: message,
            },
          },
        });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        // Don't fail the entire operation if notification fails
        console.warn("Request created but notification delivery may have failed");
      }

      // Reset form
      setMessage("");
      setActionType(null);
      onOpenChange(false);

      toast({
        title: "✅ Request submitted",
        description: `Your ${actionType} has been sent to the team`,
      });

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
      setMessage("");
      setActionType(null);
    }
    onOpenChange(newOpen);
  };

  if (actionType === null) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invoice Action - #{invoiceNumber}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">What would you like to do regarding this invoice?</p>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              onClick={() => setActionType("question")}
              disabled={isSubmitting}
            >
              <HelpCircle className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">Ask a Question</p>
                <p className="text-xs text-muted-foreground">Get clarification about charges or terms</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 hover:bg-red-50 hover:border-red-200 transition-colors"
              onClick={() => setActionType("dispute")}
              disabled={isSubmitting}
            >
              <AlertCircle className="h-5 w-5 mr-3 text-red-600 flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">Report an Issue</p>
                <p className="text-xs text-muted-foreground">Report incorrect charges or billing errors</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {actionType === "question" ? "Ask a Question" : "Report an Issue"} - Invoice #{invoiceNumber}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="message">{actionType === "question" ? "Your Question" : "Issue Description"} *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              rows={5}
              placeholder={
                actionType === "question"
                  ? "What would you like to know about this invoice? Be as specific as possible."
                  : "Please describe the issue with this invoice. Include any relevant details or amounts."
              }
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground">{message.length}/1000 characters</p>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              actionType === "question" ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"
            }`}
          >
            <p className={actionType === "question" ? "text-blue-800 text-sm" : "text-red-800 text-sm"}>
              {actionType === "question"
                ? "ℹ️ Our team will review your question and respond within 1-2 business days."
                : "⚠️ Our team will investigate your report. We'll contact you if we need additional information."}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActionType(null);
                setMessage("");
              }}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit {actionType === "question" ? "Question" : "Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
