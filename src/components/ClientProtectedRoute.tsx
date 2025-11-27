import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';

interface ClientProtectedRouteProps {
  children: ReactNode;
}

/**
 * Protected route for client portal pages
 * Verifies user is a client for the specified organization
 */
export function ClientProtectedRoute({ children }: ClientProtectedRouteProps) {
  const { session, loading } = useUser();
  const { orgId } = useParams<{ orgId: string }>();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkClientAccess = async () => {
      if (!session || !orgId) {
        setHasAccess(false);
        setChecking(false);
        return;
      }

      try {
        // Check if user is a client for this organization (by user_id OR email)
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('id, organization_id')
          .or(`user_id.eq.${session.user.id},email.ilike.${session.user.email}`)
          .eq('organization_id', orgId)
          .is('deleted_at', null)
          .maybeSingle();

        if (error) {
          console.error('Error checking client access:', error);
          setHasAccess(false);
        } else {
          setHasAccess(!!clientData);
        }
      } catch (error) {
        console.error('Error checking client access:', error);
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    checkClientAccess();
  }, [session, orgId]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    // Store context for redirect after login
    if (orgId) {
      localStorage.setItem('auth_context', 'client');
      localStorage.setItem('auth_org_id', orgId);
    }
    return <Navigate to={`/login?context=client&orgId=${orgId}`} replace />;
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have access to this client portal.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
