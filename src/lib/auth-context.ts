/**
 * Authentication Context Management
 * 
 * Utilities for managing multi-role authentication context.
 * Supports users who can be both agency members AND clients across different organizations.
 */

export type AuthContext = 'agency' | 'client';

interface StoredAuthContext {
  context: AuthContext;
  orgId: string;
  timestamp: number;
}

const CONTEXT_STORAGE_KEY = 'auth_context';
const ORG_ID_STORAGE_KEY = 'auth_org_id';
const CONTEXT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Store authentication context for later use during auth callback
 */
export function storeAuthContext(context: AuthContext, orgId: string): void {
  const data: StoredAuthContext = {
    context,
    orgId,
    timestamp: Date.now(),
  };
  
  localStorage.setItem(CONTEXT_STORAGE_KEY, context);
  localStorage.setItem(ORG_ID_STORAGE_KEY, orgId);
  
  console.log('Stored auth context:', data);
}

/**
 * Retrieve stored authentication context
 * Returns null if expired or not found
 */
export function getStoredAuthContext(): { context: AuthContext; orgId: string } | null {
  const context = localStorage.getItem(CONTEXT_STORAGE_KEY) as AuthContext | null;
  const orgId = localStorage.getItem(ORG_ID_STORAGE_KEY);
  
  if (!context || !orgId) {
    return null;
  }
  
  return { context, orgId };
}

/**
 * Clear stored authentication context
 */
export function clearAuthContext(): void {
  localStorage.removeItem(CONTEXT_STORAGE_KEY);
  localStorage.removeItem(ORG_ID_STORAGE_KEY);
  console.log('Cleared auth context');
}

/**
 * Generate a context-aware login URL
 */
export function getContextLoginUrl(context: AuthContext, orgId: string, returnUrl?: string): string {
  const params = new URLSearchParams({
    context,
    orgId,
  });
  
  if (returnUrl) {
    params.set('returnUrl', returnUrl);
  }
  
  return `/login?${params.toString()}`;
}

/**
 * Generate a context-aware invitation URL for emails
 */
export function getContextInvitationUrl(
  baseUrl: string,
  context: AuthContext,
  orgId: string
): string {
  const params = new URLSearchParams({
    context,
    orgId,
  });
  
  return `${baseUrl}/auth/callback?${params.toString()}`;
}
