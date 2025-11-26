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
        const type = searchParams.get("type");
        const accessToken = searchParams.get("access_token");

        console.log("Auth callback - type:", type);
        console.log("Auth callback - access_token present:", !!accessToken);

        // Check for error in URL (from Supabase)
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (error) {
          console.error("Auth error:", error, errorDescription);
          toast({
            title: "Authentication Error",
            description:
              errorDescription === "Email link is invalid or has expired"
                ? "Your link has expired. Please request a new one."
                : errorDescription || "An error occurred during authentication",
            variant: "destructive",
          });
          navigate("/login", { replace: true });
          return;
        }

        // Get the session from Supabase
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          toast({
            title: "Session Error",
            description:
              sessionError.message === "Invalid Refresh Token: Already Used"
                ? "Your link has expired. Please request a new one."
                : "Failed to retrieve your session. Please try again.",
            variant: "destructive",
          });
          navigate("/login", { replace: true });
          return;
        }

        if (session) {
          console.log("Session found:", session.user.email);

          // CRITICAL: Check for password recovery FIRST before any other checks
          if (type === "recovery" || accessToken) {
            console.log("Password recovery detected - redirecting to /reset-password");
            toast({
              title: "Email Verified",
              description: "Please set your new password",
            });
            navigate("/reset-password", { replace: true });
            return;
          }

          // Clear any stored context from localStorage
          localStorage.removeItem("auth_context");
          localStorage.removeItem("auth_org_id");
          // Clear persisted user mode so we don't respect stale choices
          localStorage.removeItem("kenly_user_mode");

          // Defensively query organization_members and clients. If queries error,
          // we default to empty arrays and mark the org query error so we don't
          // accidentally route the user to client-only when the org lookup failed.
          let orgMemberships: any[] = [];
          let orgQueryErrored = false;
          try {
            const { data: orgMembershipsData, error: orgErr } = await supabase
              .from("organization_members")
              .select("organization_id")
              .eq("user_id", session.user.id)
              .is("deleted_at", null);
            if (orgErr) {
              console.error("organization_members query error:", orgErr);
              orgQueryErrored = true;
            } else {
              orgMemberships = orgMembershipsData || [];
            }
          } catch (e) {
            console.error("organization_members unexpected error:", e);
            orgQueryErrored = true;
            orgMemberships = [];
          }

          console.log(`User has ${orgMemberships.length} organization(s) (orgQueryErrored=${orgQueryErrored})`);

          // Check if user is a client
          let clientRecords: any[] = [];
          try {
            const { data: clientRecordsData, error: clientErr } = await supabase
              .from("clients")
              .select("organization_id")
              .eq("user_id", session.user.id)
              .is("deleted_at", null);
            if (clientErr) {
              console.error("clients query error:", clientErr);
            } else {
              clientRecords = clientRecordsData || [];
            }
          } catch (e) {
            console.error("clients unexpected error:", e);
            clientRecords = [];
          }

          console.log(`User has ${clientRecords.length} client record(s)`);

          const hasOrgMemberships = orgMemberships.length > 0;
          const hasClientRecords = clientRecords.length > 0;

          // Update last_seen_at for agency members
          if (hasOrgMemberships) {
            try {
              await supabase.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", session.user.id);
            } catch (error) {
              console.error("Error updating last_seen_at:", error);
            }
          }

          // If both roles -> show role selection screen
          if (hasOrgMemberships && hasClientRecords) {
            toast({
              title: "Welcome!",
              description: "Please select which part of the app you'd like to access",
            });
            // Small delay to ensure session propagates to UserContext
            setTimeout(() => {
              navigate("/select-role", { replace: true });
            }, 500);
            return;
          }

          // If the org lookup errored but we found client records, we are uncertain:
          // be conservative and route to /select-role so the user can pick rather than
          // forcing client-only mode.
          if (orgQueryErrored && hasClientRecords) {
            console.warn("Org lookup errored but client records exist — routing to /select-role for safety");
            toast({
              title: "Welcome!",
              description: "Please select which part of the app you'd like to access",
            });
            setTimeout(() => {
              navigate("/select-role", { replace: true });
            }, 500);
            return;
          }

          // Handle agency members only
          if (hasOrgMemberships) {
            if (orgMemberships.length === 1) {
              // Only one organization - redirect directly
              toast({
                title: "Welcome!",
                description: "Your email has been verified successfully",
              });
              // Small delay to ensure session propagates to UserContext
              setTimeout(() => {
                navigate(`/dashboard/${orgMemberships[0].organization_id}`, { replace: true });
              }, 500);
              return;
            } else {
              // Multiple organizations - ALWAYS show selection screen
              toast({
                title: "Welcome!",
                description: "Please select an organization to continue",
              });
              // Small delay to ensure session propagates to UserContext
              setTimeout(() => {
                navigate("/select-organization", { replace: true });
              }, 500);
              return;
            }
          }

          // Handle clients only (no agency membership)
          if (hasClientRecords) {
            if (clientRecords.length === 1) {
              // Only one organization - redirect directly to portal
              toast({
                title: "Welcome!",
                description: "Accessing your client portal...",
              });
              navigate(`/client-portal/${clientRecords[0].organization_id}`, { replace: true });
              return;
            } else {
              // Multiple organizations - show client dashboard
              toast({
                title: "Welcome!",
                description: "Choose an organization to access...",
              });
              navigate("/client-dashboard", { replace: true });
              return;
            }
          }

          // User has no roles - this shouldn't happen
          console.warn("User has no organization membership or client record");
          toast({
            title: "No Organization Access",
            description: "You don't belong to any organization yet.",
            variant: "destructive",
          });
          navigate("/no-organization", { replace: true });
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
