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
        // Check if user is a client for this organization
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", user.id)
          .eq("organization_id", formData.organization_id)
          .is("deleted_at", null)
          .maybeSingle();

        if (clientData && !clientError) {
          // User is already a client - grant access immediately
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
        } else {
          // User is authenticated but not a client - auto-create client record
          console.log("Auto-creating client record for authenticated user");
          
          try {
            const { data: autoClientData, error: autoCreateError } = await supabase.functions.invoke(
              'auto-create-client',
              {
                body: {
                  email: user.email,
                  full_name: user.user_metadata?.full_name,
                  organization_id: formData.organization_id,
                  form_id: formData.id,
                },
              }
            );

            if (autoCreateError) {
              console.error("Failed to auto-create client:", autoCreateError);
            } else if (autoClientData?.client) {
              setClient(autoClientData.client);
              setAuthenticated(true);
              
              console.log("Client auto-created successfully");
            }
          } catch (autoError) {
            console.error("Error auto-creating client:", autoError);
          }
        }
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
