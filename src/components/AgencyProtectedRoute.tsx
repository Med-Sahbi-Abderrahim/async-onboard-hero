import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';

interface AgencyProtectedRouteProps {
  children: ReactNode;
}

/**
 * Protected route for agency dashboard pages
 * Verifies user is a member of the specified organization
 */
export function AgencyProtectedRoute({ children }: AgencyProtectedRouteProps) {
  const { session, loading } = useUser();
  const { orgId } = useParams<{ orgId: string }>();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAgencyAccess = async () => {
      if (!session || !orgId) {
        setHasAccess(false);
        setChecking(false);
        return;
      }

      try {
        // Check if user is a member of this organization
        const { data: memberData, error } = await supabase
          .from('organization_members')
          .select('id, organization_id, role')
          .eq('user_id', session.user.id)
          .eq('organization_id', orgId)
          .is('deleted_at', null)
          .maybeSingle();

        if (error) {
          console.error('Error checking organization access:', error);
          setHasAccess(false);
        } else {
          setHasAccess(!!memberData);
        }
      } catch (error) {
        console.error('Error checking organization access:', error);
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    checkAgencyAccess();
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
      localStorage.setItem('auth_context', 'agency');
      localStorage.setItem('auth_org_id', orgId);
    }
    return <Navigate to={`/login?context=agency&orgId=${orgId}`} replace />;
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have access to this organization.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
