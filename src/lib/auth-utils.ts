/**
 * Get the appropriate redirect URL for Supabase auth flows.
 * 
 * This ensures clients are never redirected to private preview URLs.
 * - In preview environments: Returns published/production URL
 * - In local/production: Returns current origin
 */
export function getAuthRedirectUrl(path: string = "/auth/callback"): string {
  const origin = window.location.origin;
  
  // Detect if we're in a Lovable preview environment
  const isPreview = origin.includes("preview--") || origin.includes(".lovable.app");
  
  if (isPreview) {
    // Extract the base domain and convert preview URL to published URL
    // preview--project-name.lovable.app -> project-name.lovable.app
    const publishedOrigin = origin.replace("preview--", "");
    return `${publishedOrigin}${path}`;
  }
  
  // For local development or production, use current origin
  return `${origin}${path}`;
}

/**
 * Get the client portal URL for redirecting after authentication
 */
export function getClientPortalUrl(): string {
  return getAuthRedirectUrl("/client-portal");
}
