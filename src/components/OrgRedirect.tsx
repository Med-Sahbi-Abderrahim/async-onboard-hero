import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

/**
 * Redirects legacy routes without orgId to org-based routes
 * Fetches the user's first organization and redirects there
 */
export function OrgRedirect() {
  const { session } = useUser();
  const location = useLocation();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFirstOrg = async () => {
      if (!session?.user?.id) {
        setRedirectTo('/login');
        setLoading(false);
        return;
      }

      try {
        const { data: memberships, error } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .is('deleted_at', null);

        if (error) {
          console.error('Error fetching organizations:', error);
          setRedirectTo('/login');
        } else if (!memberships || memberships.length === 0) {
          // No organizations - redirect to no-organization page
          setRedirectTo('/no-organization');
        } else if (memberships.length === 1) {
          // Single organization - redirect directly
          const pathSegments = location.pathname.split('/').filter(Boolean);
          const newPath = `/${pathSegments[0]}/${memberships[0].organization_id}${
            pathSegments.length > 1 ? '/' + pathSegments.slice(1).join('/') : ''
          }`;
          setRedirectTo(newPath);
        } else {
          // Multiple organizations - go to selector
          setRedirectTo('/select-organization');
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setRedirectTo('/login');
      } finally {
        setLoading(false);
      }
    };

    getFirstOrg();
  }, [session, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return null;
}
