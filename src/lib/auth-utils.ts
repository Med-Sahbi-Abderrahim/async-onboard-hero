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
 * IMPORTANT: Set VITE_PUBLIC_URL environment variable to your published app URL
 * Example: VITE_PUBLIC_URL=https://your-app.lovable.app
 * 
 * - If VITE_PUBLIC_URL is set: Always use that
 * - If on published lovable.app (no preview--): Use current origin
 * - If on preview or lovableproject.com: Warn and use current origin as fallback
 */
export function getPublicUrl(path: string = ""): string {
  // Always prefer the environment variable if set
  const envPublicUrl = import.meta.env.VITE_PUBLIC_URL;
  if (envPublicUrl) {
    return `${envPublicUrl}${path}`;
  }
  
  const origin = window.location.origin;
  
  // Check if we're on a private preview environment
  const isPreview = origin.includes("preview--");
  const isLovableProject = origin.includes(".lovableproject.com");
  
  // If on a published lovable.app URL (no preview--), use it
  const isPublishedLovable = origin.includes(".lovable.app") && !isPreview;
  if (isPublishedLovable) {
    return `${origin}${path}`;
  }
  
  // If we're on a preview/dev environment without VITE_PUBLIC_URL set, warn
  if (isPreview || isLovableProject) {
    console.warn(
      '⚠️ Generating client link from preview environment. ' +
      'Set VITE_PUBLIC_URL to your published app URL to avoid "Access Denied" errors. ' +
      'Example: VITE_PUBLIC_URL=https://your-app.lovable.app'
    );
  }
  
  // Fallback to current origin (may cause issues in preview)
  return `${origin}${path}`;
}

/**
 * Get the client portal URL for redirecting after authentication
 */
export function getClientPortalUrl(): string {
  return getAuthRedirectUrl("/client-portal");
}

/**
 * Generate a form URL for sharing with clients
 */
export function getFormUrl(formSlug: string): string {
  return getPublicUrl(`/form/${formSlug}`);
}
