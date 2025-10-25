import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseFormAutosaveProps {
  formId: string;
  clientId: string;
  organizationId: string;
  responses: Record<string, any>;
  submissionId?: string;
  onSubmissionCreated?: (id: string) => void;
}

export function useFormAutosave({
  formId,
  clientId,
  organizationId,
  responses,
  submissionId,
  onSubmissionCreated,
}: UseFormAutosaveProps) {
  const [saving, setSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    const currentData = JSON.stringify(responses);
    
    // Skip if no changes or empty responses
    if (currentData === lastSavedRef.current || Object.keys(responses).length === 0) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for autosave (2 seconds after last change)
    timeoutRef.current = setTimeout(async () => {
      setSaving(true);
      
      try {
        const submissionData: any = {
          responses,
          status: "pending",
          completion_percentage: 0,
        };

        if (submissionId) {
          // Update existing draft
          const { error } = await supabase
            .from("form_submissions")
            .update(submissionData)
            .eq("id", submissionId);

          if (error) throw error;
        } else {
          // Create new draft submission
          const { data, error } = await supabase
            .from("form_submissions")
            .insert({
              ...submissionData,
              intake_form_id: formId,
              client_id: clientId,
              organization_id: organizationId,
            } as any)
            .select()
            .single();

          if (error) throw error;
          if (data && onSubmissionCreated) {
            onSubmissionCreated(data.id);
          }
        }

        lastSavedRef.current = currentData;
      } catch (error) {
        console.error("Autosave error:", error);
      } finally {
        setSaving(false);
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [responses, submissionId, formId, clientId, organizationId, onSubmissionCreated]);

  return { saving };
}
