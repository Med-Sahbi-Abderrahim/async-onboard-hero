import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useFeedback() {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const submitFeedback = async (rating: number, message: string, clientId: string, organizationId: string) => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return false;
    }

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter your feedback",
        variant: "destructive",
      });
      return false;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("client_feedback").insert({
        client_id: clientId,
        organization_id: organizationId,
        rating,
        message,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Thank you for your feedback!",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { submitFeedback, submitting };
}
