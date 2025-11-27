// src/pages/PublicFormSubmit.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useOrgBranding } from "@/hooks/useOrgBranding";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface IntakeForm {
  id: string;
  title: string;
  description: string | null;
  fields: FormField[];
  organization_id: string;
  custom_branding: any;
}

export default function PublicFormSubmit() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<IntakeForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { branding } = useOrgBranding(form?.organization_id);

  useEffect(() => {
    loadForm();
  }, [slug]);

  const loadForm = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      console.log("Loading form with slug:", slug);

      const { data, error } = await supabase
        .from("intake_forms")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        console.error("Error loading form:", error);
        throw error;
      }

      if (!data) {
        console.log("Form not found");
        setForm(null);
        setLoading(false);
        return;
      }

      console.log("Form loaded:", data);
      setForm(data);

      // Increment view count
      await supabase.rpc("increment_form_view_count", { form_id: data.id });
    } catch (error: any) {
      console.error("Error loading form:", error);
      toast({
        title: "Error loading form",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setSubmitting(true);

    try {
      // Validate required fields
      const fields = form.fields as FormField[];
      for (const field of fields) {
        if (field.required && !formData[field.id]) {
          throw new Error(`${field.label} is required`);
        }
      }

      // Email is always required
      if (!formData.email) {
        throw new Error("Email is required");
      }

      // 1. Create or find client record
      let clientId: string;
      
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("email", formData.email.toLowerCase())
        .eq("organization_id", form.organization_id)
        .is("deleted_at", null)
        .maybeSingle();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Create new client (user_id will be NULL - set later when org sends invite)
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            email: formData.email.toLowerCase(),
            full_name: formData.full_name || formData.name || formData.email,
            company_name: formData.company_name || formData.company || null,
            phone: formData.phone || null,
            organization_id: form.organization_id,
            status: "active",
            // user_id stays NULL - will be set when organization sends portal invite
          })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // 2. Create form submission
      const { error: submissionError } = await supabase
        .from("form_submissions")
        .insert({
          intake_form_id: form.id,
          client_id: clientId,
          organization_id: form.organization_id,
          responses: formData,
          status: "pending",
          completion_percentage: 100,
          submitted_at: new Date().toISOString(),
        });

      if (submissionError) throw submissionError;

      // 3. Update form submission count
      await supabase
        .from("intake_forms")
        .update({
          submission_count: (form as any).submission_count + 1,
        })
        .eq("id", form.id);

      // 4. Show success
      setSubmitted(true);
      
      toast({
        title: "✅ Submission received",
        description: "Thank you! We'll review your information and be in touch soon.",
      });

    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "⚠️ Submission failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.id] || ""}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              disabled={submitting}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={formData[field.id] || ""}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              disabled={submitting}
              rows={4}
            />
          </div>
        );

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <select
              id={field.id}
              value={formData[field.id] || ""}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              disabled={submitting}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">Select an option</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Form Not Found</h2>
            <p className="text-muted-foreground">
              This form is not available or has been unpublished.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

    if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle>Submission Received</CardTitle>
            <CardDescription>
              Thank you! Your information has been successfully submitted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              onClick={() => navigate("/")}
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: branding?.background_color || "#f9fafb",
      }}
    >
      <Card className="w-full max-w-2xl">
        <CardHeader
          style={{
            borderBottom: "1px solid rgba(0,0,0,0.05)",
            backgroundColor: branding?.header_background || "white",
          }}
        >
          {branding?.logo_url && (
            <img
              src={branding.logo_url}
              alt="Brand Logo"
              className="h-10 mb-4 object-contain"
            />
          )}
          <CardTitle
            style={{
              color: branding?.primary_color || "inherit",
            }}
          >
            {form.title}
          </CardTitle>
          {form.description && (
            <CardDescription>{form.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email field ALWAYS required */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email || ""}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            {/* Dynamic form fields */}
            {form.fields?.map((field) => renderField(field))}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </div>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
