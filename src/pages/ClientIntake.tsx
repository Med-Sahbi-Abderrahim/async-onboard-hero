import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * @deprecated This page is no longer used. 
 * Clients now authenticate via Supabase magic links sent when they are invited.
 * Redirecting to client portal for backward compatibility.
 */
export default function ClientIntake() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to client portal - they'll be prompted to authenticate there
    navigate("/client-portal", { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}
