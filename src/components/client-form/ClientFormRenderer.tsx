import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import { ClientFormField } from "./ClientFormField";
import { useFormAutosave } from "@/hooks/useFormAutosave";

interface ClientFormRendererProps {
  form: any;
  client: any;
  existingSubmission?: any;
  onSubmitted: () => void;
}

export function ClientFormRenderer({
  form,
  client,
  existingSubmission,
  onSubmitted,
}: ClientFormRendererProps) {
  const fields = form.fields || [];
  const branding = form.custom_branding || {};
  const primaryColor = branding.primary_color || "#4F46E5";
  
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>(
    existingSubmission?.responses || {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState(existingSubmission?.id);

  const { toast } = useToast();

  // Split fields into steps (5 fields per step)
  const fieldsPerStep = 5;
  const steps = [];
  for (let i = 0; i < fields.length; i += fieldsPerStep) {
    steps.push(fields.slice(i, i + fieldsPerStep));
  }

  const totalSteps = steps.length;
  const currentFields = steps[currentStep] || [];
  const completionPercentage = Math.round(
    (Object.keys(responses).length / fields.length) * 100
  );

  // Autosave hook
  const { saving } = useFormAutosave({
    formId: form.id,
    clientId: client.id,
    organizationId: form.organization_id,
    responses,
    submissionId,
    onSubmissionCreated: (id) => setSubmissionId(id),
  });

  const validateField = (field: any, value: any): string | null => {
    if (field.required && (!value || value === "")) {
      return `${field.label} is required`;
    }

    if (field.type === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address";
      }
    }

    return null;
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    currentFields.forEach((field: any) => {
      const error = validateField(field, responses[field.id]);
      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
    
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    // Validate all required fields
    const allErrors: Record<string, string> = {};
    fields.forEach((field: any) => {
      const error = validateField(field, responses[field.id]);
      if (error) {
        allErrors[field.id] = error;
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      toast({
        title: "Please complete all required fields",
        description: "Some required fields are missing or invalid.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const submissionData: any = {
        status: "completed",
        responses,
        submitted_at: new Date().toISOString(),
        completion_percentage: 100,
      };

      if (submissionId) {
        // Update existing draft
        const { error } = await supabase
          .from("form_submissions")
          .update(submissionData)
          .eq("id", submissionId);

        if (error) throw error;
      } else {
        // Create new submission
        const { error } = await supabase
          .from("form_submissions")
          .insert({
            ...submissionData,
            intake_form_id: form.id,
            client_id: client.id,
            organization_id: form.organization_id,
          } as any);

        if (error) throw error;
      }

      // Increment form submission and view counts
      await supabase
        .from("intake_forms")
        .update({ 
          submission_count: form.submission_count + 1 
        })
        .eq("id", form.id);

      onSubmitted();
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {branding.logo_url && (
          <div className="flex justify-center mb-6">
            <img src={branding.logo_url} alt="Logo" className="h-16 object-contain" />
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>{form.title}</CardTitle>
              {saving && (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Saving...
                </span>
              )}
            </div>
            <CardDescription>{form.description}</CardDescription>
            
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <span className="text-muted-foreground">
                  {completionPercentage}% Complete
                </span>
              </div>
              <Progress value={completionPercentage} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {currentFields.map((field: any) => (
              <ClientFormField
                key={field.id}
                field={field}
                value={responses[field.id]}
                error={errors[field.id]}
                onChange={(value) => handleFieldChange(field.id, value)}
                organizationId={form.organization_id}
                submissionId={submissionId}
              />
            ))}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0 || submitting}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep < totalSteps - 1 ? (
                <Button onClick={handleNext} style={{ backgroundColor: primaryColor }}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  style={{ backgroundColor: primaryColor }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Form"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
