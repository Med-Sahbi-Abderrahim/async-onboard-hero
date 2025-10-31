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

        // Send magic link to client's email
        // Use current origin for callback (ensures it works in all environments)
        const callbackUrl = `${window.location.origin}/auth/callback`;
        
        console.log("Sending magic link to:", client.email, "with callback:", callbackUrl);
        
        const { error: magicLinkError } = await supabase.auth.signInWithOtp({
          email: client.email,
          options: {
            emailRedirectTo: callbackUrl,
          },
        });

        if (magicLinkError) throw magicLinkError;

        toast({
          title: "Check Your Email",
          description: "We've sent you a secure login link. Please check your email to access your portal.",
        });

        navigate("/", { replace: true });
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
