import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleReturnToDashboard = async () => {
    // Check if user is logged in and find their org
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Find user's first organization
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle();
      
      if (orgMember) {
        navigate(`/dashboard/${orgMember.organization_id}`);
        return;
      }
      
      // Check if user is a client
      const { data: clientData } = await supabase
        .from('clients')
        .select('organization_id')
        .eq('email', session.user.email)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle();
      
      if (clientData) {
        navigate(`/client-portal/${clientData.organization_id}`);
        return;
      }
    }
    
    // Not logged in or no org found - go to home
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Button onClick={handleReturnToDashboard} variant="default">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
