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
        const accessToken = searchParams.get('access_token');
        const contextParam = searchParams.get('context');
        const orgIdParam = searchParams.get('orgId');
        
        console.log("Auth callback - type:", type);
        console.log("Auth callback - access_token present:", !!accessToken);
        console.log("Auth callback - context:", contextParam);
        console.log("Auth callback - orgId:", orgIdParam);
        
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
          console.log("Session found:", session.user.email);
          
          // CRITICAL: Check for password recovery FIRST before any other checks
          if (type === 'recovery' || accessToken) {
            console.log("Password recovery detected - redirecting to /reset-password");
            toast({
              title: "Email Verified",
              description: "Please set your new password",
            });
            navigate("/reset-password", { replace: true });
            return;
          }
          
          // Read stored context from localStorage (set during invitation or login)
          const storedContext = localStorage.getItem('auth_context');
          const storedOrgId = localStorage.getItem('auth_org_id');
          
          // Use URL params first, then fall back to stored context
          const finalContext = contextParam || storedContext;
          const finalOrgId = orgIdParam || storedOrgId;
          
          console.log("Final context:", finalContext);
          console.log("Final orgId:", finalOrgId);
          
          // Clear stored context after reading
          localStorage.removeItem('auth_context');
          localStorage.removeItem('auth_org_id');
          
          if (finalContext === 'client' && finalOrgId) {
            // CLIENT CONTEXT: Redirect to client portal
            console.log("Client context - redirecting to client-portal");
            
            // Verify user is actually a client for this org
            const { data: clientData } = await supabase
              .from('clients')
              .select('id, organization_id')
              .eq('user_id', session.user.id)
              .eq('organization_id', finalOrgId)
              .maybeSingle();
            
            if (!clientData) {
              toast({
                title: "Access Denied",
                description: "You don't have access to this client portal.",
                variant: "destructive",
              });
              navigate("/login", { replace: true });
              return;
            }
            
            toast({
              title: "Welcome!",
              description: "Accessing your client portal...",
            });
            navigate(`/client-portal/${finalOrgId}`, { replace: true });
            return;
          }
          
          if (finalContext === 'agency' && finalOrgId) {
            // AGENCY CONTEXT: Redirect to dashboard
            console.log("Agency context - redirecting to dashboard for org:", finalOrgId);
            
            // Verify user is a member of this organization
            const { data: memberData } = await supabase
              .from('organization_members')
              .select('organization_id')
              .eq('user_id', session.user.id)
              .eq('organization_id', finalOrgId)
              .maybeSingle();
            
            if (!memberData) {
              // User isn't a member of the specified org, check all their orgs
              const { data: allMemberships } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', session.user.id);
              
              if (!allMemberships || allMemberships.length === 0) {
                toast({
                  title: "No Organization Access",
                  description: "You don't belong to any organization yet.",
                  variant: "destructive",
                });
                navigate("/no-organization", { replace: true });
                return;
              }
              
              if (allMemberships.length === 1) {
                // Redirect to their only org
                navigate(`/dashboard/${allMemberships[0].organization_id}`, { replace: true });
                return;
              }
              
              // Multiple orgs - show selection
              toast({
                title: "Organization Not Found",
                description: "Please select an organization to continue",
              });
              navigate("/select-organization", { replace: true });
              return;
            }
            
            // Update last_seen_at for agency users
            try {
              await supabase
                .from('users')
                .update({ last_seen_at: new Date().toISOString() })
                .eq('id', session.user.id);
            } catch (error) {
              console.error("Error updating last_seen_at:", error);
            }
            
            toast({
              title: "Welcome!",
              description: "Your email has been verified successfully",
            });
            navigate(`/dashboard/${finalOrgId}`, { replace: true });
            return;
          }
          
          // NO CONTEXT: Determine default route
          // Check ALL organization memberships
          const { data: orgMemberships } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id);
          
          if (orgMemberships && orgMemberships.length > 0) {
            // User is an agency member
            console.log(`Default: Agency member with ${orgMemberships.length} organization(s)`);
            
            try {
              await supabase
                .from('users')
                .update({ last_seen_at: new Date().toISOString() })
                .eq('id', session.user.id);
            } catch (error) {
              console.error("Error updating last_seen_at:", error);
            }
            
            if (orgMemberships.length === 1) {
              // Only one organization - redirect directly
              toast({
                title: "Welcome!",
                description: "Your email has been verified successfully",
              });
              navigate(`/dashboard/${orgMemberships[0].organization_id}`, { replace: true });
            } else {
              // Multiple organizations - show selection screen
              toast({
                title: "Welcome!",
                description: "Please select an organization to continue",
              });
              navigate('/select-organization', { replace: true });
            }
            return;
          }
          
          // Check if user is ONLY a client
          const { data: clientRecords } = await supabase
            .from('clients')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .is('deleted_at', null);
          
          if (clientRecords && clientRecords.length > 0) {
            // User is a client
            console.log(`Default: Client with access to ${clientRecords.length} organization(s)`);
            
            if (clientRecords.length === 1) {
              // Only one organization - redirect directly to portal
              toast({
                title: "Welcome!",
                description: "Accessing your client portal...",
              });
              navigate(`/client-portal/${clientRecords[0].organization_id}`, { replace: true });
            } else {
              // Multiple organizations - show dashboard
              toast({
                title: "Welcome!",
                description: "Choose an organization to access...",
              });
              navigate('/client-dashboard', { replace: true });
            }
            return;
          }
          
          // User has no roles - this shouldn't happen
          console.warn("User has no organization membership or client record");
          toast({
            title: "Access Error",
            description: "No organization access found. Please contact support.",
            variant: "destructive",
          });
          navigate("/login", { replace: true });
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
