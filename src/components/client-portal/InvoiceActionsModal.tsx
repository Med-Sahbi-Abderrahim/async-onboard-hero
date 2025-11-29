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
  onSuccess 
}: InvoiceActionsModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<"question" | "dispute" | null>(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionType) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("client_requests").insert({
        client_id: clientId,
        organization_id: organizationId,
        request_type: "change_request",
        title: `${actionType === "question" ? "Question" : "Issue"} - Invoice #${invoiceNumber}`,
        description: message,
        status: "pending",
        metadata: {
          invoice_id: invoiceId,
          action_type: actionType,
        },
      });

      if (error) throw error;

      toast({
        title: "✅ Request submitted",
        description: `Your ${actionType} has been sent to the team`,
      });

      setMessage("");
      setActionType(null);
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
          <DialogTitle>Invoice Action - #{invoiceNumber}</DialogTitle>
        </DialogHeader>

        {!actionType ? (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">What would you like to do?</p>
            
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => setActionType("question")}
            >
              <HelpCircle className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-semibold">Ask a Question</p>
                <p className="text-xs text-muted-foreground">Get clarification about this invoice</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => setActionType("dispute")}
            >
              <AlertCircle className="h-5 w-5 mr-3 text-destructive" />
              <div className="text-left">
                <p className="font-semibold">Report an Issue</p>
                <p className="text-xs text-muted-foreground">Report incorrect charges or billing errors</p>
              </div>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="message">
                {actionType === "question" ? "Your Question" : "Issue Description"} *
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSubmitting}
                rows={5}
                placeholder={
                  actionType === "question" 
                    ? "What would you like to know about this invoice?" 
                    : "Please describe the issue with this invoice"
                }
                required
              />
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
        )}
      </DialogContent>
    </Dialog>
  );
}
