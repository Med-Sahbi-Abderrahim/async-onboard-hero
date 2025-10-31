import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getAuthRedirectUrl } from "@/lib/auth-utils";

export default function ClientIntake() {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const validateTokenAndRedirect = async () => {
      if (!token) {
        toast({
          title: "Invalid Link",
          description: "The link you used is invalid.",
          variant: "destructive",
        });
        navigate("/", { replace: true });
        return;
      }

      try {
        console.log("Validating access token:", token);
        
        // Find client by access token
        const { data: client, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("access_token", token)
          .is("deleted_at", null)
          .maybeSingle();
        
        console.log("Client lookup result:", { client, error: clientError });

        if (clientError || !client) {
          toast({
            title: "Invalid Link",
            description: "This link is invalid or has expired.",
            variant: "destructive",
          });
          navigate("/", { replace: true });
          return;
        }

        // Check if token is expired
        if (client.access_token_expires_at) {
          const expiresAt = new Date(client.access_token_expires_at);
          if (expiresAt < new Date()) {
            toast({
              title: "Link Expired",
              description: "Your link has expired. Please request a new one.",
              variant: "destructive",
            });
            navigate("/", { replace: true });
            return;
          }
        }

        // Store client session in localStorage (simple token-based auth for clients)
        localStorage.setItem("client_token", token);
        localStorage.setItem("client_email", client.email);

        toast({
          title: "Welcome!",
          description: "Accessing your client portal...",
        });

        // Redirect directly to client portal
        navigate("/client-portal", { replace: true });
      } catch (error) {
        console.error("Token validation error:", error);
        toast({
          title: "Error",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
        navigate("/", { replace: true });
      }
    };

    validateTokenAndRedirect();
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Verifying your access...</p>
        <p className="text-sm text-muted-foreground mt-2">Please wait a moment</p>
      </div>
    </div>
  );
}
