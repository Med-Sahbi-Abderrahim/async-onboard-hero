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
 * Get the public/published URL for generating shareable client links.
 * This ensures clients always receive public URLs, never private preview URLs.
 * 
 * - In Lovable preview: Returns the published lovableproject.com URL
 * - In local/production: Returns current origin
 */
export function getPublicUrl(path: string = ""): string {
  const origin = window.location.origin;
  
  // Detect if we're in a Lovable preview or project environment
  const isPreview = origin.includes("preview--");
  const isLovableProject = origin.includes(".lovableproject.com") || origin.includes(".lovable.app");
  
  if (isPreview || isLovableProject) {
    // Extract project ID from URLs like:
    // preview--async-onboard-hero-gac49.lovable.app
    // 7aed3308-34c5-4d2f-88c2-c2b8ba45092d.lovableproject.com
    
    // For preview URLs, convert to published URL
    if (isPreview) {
      const publishedOrigin = origin.replace("preview--", "");
      return `${publishedOrigin}${path}`;
    }
    
    // For lovableproject.com URLs, they're already public
    return `${origin}${path}`;
  }
  
  // For local development or custom domains, use current origin
  return `${origin}${path}`;
}

/**
 * Get the client portal URL for redirecting after authentication
 */
export function getClientPortalUrl(): string {
  return getAuthRedirectUrl("/client-portal");
}

/**
 * Generate a magic link for a client using their access token
 */
export function getClientMagicLink(accessToken: string): string {
  return getPublicUrl(`/intake/${accessToken}`);
}
