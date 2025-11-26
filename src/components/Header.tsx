import { useOrganizationContext } from "../contexts/OrganizationContext";

export function Header() {
  const { organization, loading, error } = useOrganizationContext();

  // Show loading state
  if (loading) {
    return (
      <header className="header">
        <div className="organization-name">
          <div className="skeleton-loader">Loading...</div>
        </div>
      </header>
    );
  }

  // Show error state with fallback
  if (error) {
    console.error("Header: Organization error:", error);
    return (
      <header className="header">
        <div className="organization-name">Organization</div>
      </header>
    );
  }

  // Apply branding
  const brandColor = organization?.brand_color || "#4F46E5";
  const fontFamily = organization?.custom_font_name || organization?.font_family || "Inter";

  return (
    <header
      className="header"
      style={
        {
          "--brand-color": brandColor,
          fontFamily: fontFamily,
        } as React.CSSProperties
      }
    >
      {organization?.logo_url && (
        <img src={organization.logo_url} alt={`${organization.name} logo`} className="organization-logo" />
      )}
      <div className="organization-name">{organization?.name || "Organization"}</div>
    </header>
  );
}
