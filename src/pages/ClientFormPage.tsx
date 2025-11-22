import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormRenderer } from "@/components/client-form/ClientFormRenderer";
import { ClientFormAuth } from "@/components/client-form/ClientFormAuth";
import { ClientFormSuccess } from "@/components/client-form/ClientFormSuccess";
import { Loader2 } from "lucide-react";

export default function ClientFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);

  useEffect(() => {
    loadFormAndAuth();
  }, [slug]);

  const loadFormAndAuth = async () => {
    try {
      // Load form by slug
      const { data: formData, error: formError } = await supabase
        .from("intake_forms")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .single();

      if (formError || !formData) {
        console.error("Form not found", formError);
        setLoading(false);
        return;
      }

      setForm(formData);

      // Check if user is already authenticated (SMART AUTH)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user is a client for ANY organization
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", user.id)
          .is("deleted_at", null)
          .maybeSingle();

        if (clientData && !clientError) {
          // User is authenticated and is a client - grant access immediately
          setClient(clientData);
          setAuthenticated(true);

          // Check for existing submission
          const { data: existingSubmission } = await supabase
            .from("form_submissions")
            .select("*")
            .eq("intake_form_id", formData.id)
            .eq("client_id", clientData.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingSubmission) {
            setSubmission(existingSubmission);
          }
        }
        // If user is authenticated but not a client, they'll still see auth page
      }
    } catch (error) {
      console.error("Error loading form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticated = (clientData: any, submissionData?: any) => {
    setClient(clientData);
    setAuthenticated(true);
    if (submissionData) {
      setSubmission(submissionData);
    }
  };

  const handleSubmitted = () => {
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Form Not Found</h1>
          <p className="text-muted-foreground">This form is not available.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return <ClientFormSuccess form={form} />;
  }

  if (!authenticated) {
    return <ClientFormAuth form={form} onAuthenticated={handleAuthenticated} />;
  }

  return (
    <ClientFormRenderer
      form={form}
      client={client}
      existingSubmission={submission}
      onSubmitted={handleSubmitted}
    />
  );
}
