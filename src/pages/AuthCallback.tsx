import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const type = searchParams.get('type');
        
        // Check for error in URL (from Supabase)
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error("Auth error:", error, errorDescription);
          toast({
            title: "Authentication Error",
            description: errorDescription === "Email link is invalid or has expired" 
              ? "Your link has expired. Please request a new one."
              : errorDescription || "An error occurred during authentication",
            variant: "destructive",
          });
          navigate("/login", { replace: true });
          return;
        }

        // Get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          toast({
            title: "Session Error", 
            description: sessionError.message === "Invalid Refresh Token: Already Used"
              ? "Your link has expired. Please request a new one."
              : "Failed to retrieve your session. Please try again.",
            variant: "destructive",
          });
          navigate("/login", { replace: true });
          return;
        }

        if (session) {
          // Check if user is a client
          const { data: clientData } = await supabase
            .from('clients')
            .select('id, email')
            .eq('email', session.user.email)
            .maybeSingle();

          // Update last_seen_at for regular users
          if (!clientData) {
            try {
              await supabase
                .from('users')
                .update({ last_seen_at: new Date().toISOString() })
                .eq('id', session.user.id);
            } catch (error) {
              console.error("Error updating last_seen_at:", error);
            }
          }

          // Handle different auth types
          if (type === 'recovery') {
            // Password recovery - redirect to reset password page
            toast({
              title: "Email Verified",
              description: "Please set your new password",
            });
            navigate("/reset-password", { replace: true });
          } else if (clientData) {
            // Client magic link - redirect to client portal
            toast({
              title: "Welcome!",
              description: "Accessing your client portal...",
            });
            navigate("/client-portal", { replace: true });
          } else {
            // Organization member - redirect to dashboard
            toast({
              title: "Welcome!",
              description: "Your email has been verified successfully",
            });
            navigate("/dashboard", { replace: true });
          }
        } else {
          // No session found
          console.warn("No session found after callback");
          toast({
            title: "Session Not Found",
            description: "Please try signing in again",
            variant: "destructive",
          });
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        toast({
          title: "Unexpected Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        navigate("/login", { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Verifying your email...</p>
        <p className="text-sm text-muted-foreground mt-2">Please wait while we complete your sign in</p>
      </div>
    </div>
  );
}
