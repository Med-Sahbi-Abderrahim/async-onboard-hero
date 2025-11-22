import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink } from "lucide-react";

interface ClientFormSuccessProps {
  form: any;
}

export function ClientFormSuccess({ form }: ClientFormSuccessProps) {
  const [searchParams] = useSearchParams();
  const branding = form.custom_branding || {};
  const settings = form.settings || {};
  const successMessage = settings.success_message || "Thank you for your submission!";
  const [hasPortalAccess, setHasPortalAccess] = useState(false);
  const [clientOrgId, setClientOrgId] = useState<string | null>(null);

  useEffect(() => {
    checkPortalAccess();
  }, []);

  const checkPortalAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user has client record
        const { data: clientData } = await supabase
          .from("clients")
          .select("organization_id")
          .eq("id", user.id)
          .is("deleted_at", null)
          .single();

        if (clientData) {
          setHasPortalAccess(true);
          setClientOrgId(clientData.organization_id);
        }
      }
    } catch (error) {
      console.error("Error checking portal access:", error);
    }
  };

  const handleAccessPortal = () => {
    if (clientOrgId) {
      window.location.href = `/client-portal/${clientOrgId}`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in">
      <Card className="w-full max-w-md animate-slide-up">
        {branding.logo_url && (
          <div className="flex justify-center pt-6">
            <img src={branding.logo_url} alt="Logo" className="h-16 object-contain" />
          </div>
        )}
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-success animate-success" />
          </div>
          <CardTitle className="text-3xl">Submission Complete!</CardTitle>
          <CardDescription className="text-base mt-2">{successMessage}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            We've received your information and will be in touch soon.
          </p>

          {hasPortalAccess && (
            <div className="pt-4 border-t">
              <div className="space-y-3">
                <p className="text-sm font-medium">Your client portal is ready!</p>
                <p className="text-xs text-muted-foreground">
                  Access your portal to upload documents, view contracts, schedule meetings, and track project progress.
                </p>
                <Button 
                  onClick={handleAccessPortal}
                  className="w-full"
                  size="lg"
                >
                  Access Your Portal
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
