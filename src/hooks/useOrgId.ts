import { useParams } from 'react-router-dom';

/**
 * Hook to extract orgId from URL params
 * Returns the orgId or undefined if not present
 */
export function useOrgId(): string | undefined {
  const { orgId } = useParams<{ orgId: string }>();
  return orgId;
}
