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
        const { data, error } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .limit(1)
          .single();

        if (error || !data) {
          console.error('Error fetching organization:', error);
          setRedirectTo('/login');
        } else {
          // Construct new path with orgId
          const pathSegments = location.pathname.split('/').filter(Boolean);
          const newPath = `/${pathSegments[0]}/${data.organization_id}${
            pathSegments.length > 1 ? '/' + pathSegments.slice(1).join('/') : ''
          }`;
          setRedirectTo(newPath);
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
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
