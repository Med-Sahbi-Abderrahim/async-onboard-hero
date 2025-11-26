import { useOrganizationContext } from "../contexts/OrganizationContext";
import { useAuthContext } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export function Header() {
  const { organization, loading, error } = useOrganizationContext();
  const { isClient, isOrgMember } = useAuthContext(); // restore switch logic

  if (loading) {
    return (
      <header className="header">
        <div className="organization-name">
          <div className="skeleton-loader">Loading...</div>
        </div>
      </header>
    );
  }

  if (error) {
    console.error("Header: Organization error:", error);
  }

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
      {/* Logo */}
      {organization?.logo_url && (
        <img src={organization.logo_url} alt={`${organization?.name || ""} logo`} className="organization-logo" />
      )}

      {/* Name */}
      <div className="organization-name">{organization?.name || ""}</div>

      {/* 🔥 Restore Client ↔ Org Switch */}
      <div className="role-switch">
        {isClient && isOrgMember && (
          <Link to="/org-dashboard" className="switch-button">
            Switch to Workspace
          </Link>
        )}

        {isOrgMember && isClient && (
          <Link to="/client-portal" className="switch-button">
            Switch to Client View
          </Link>
        )}
      </div>
    </header>
  );
}
