import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrgId } from "@/hooks/useOrgId";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import { useOrganizationContext } from "../contexts/OrganizationContext";

const getPageTitle = (pathname: string): string => {
  // Remove orgId from path for title matching
  const pathWithoutOrgId = pathname.replace(/\/[^/]+\/([a-f0-9-]{36})/i, "/$1");

  if (pathWithoutOrgId.includes("/dashboard")) return "Dashboard";
  if (pathWithoutOrgId.includes("/clients")) return "Clients";
  if (pathWithoutOrgId.includes("/forms")) return "Forms";
  if (pathWithoutOrgId.includes("/submissions")) return "Submissions";
  if (pathWithoutOrgId.includes("/settings")) return "Settings";
  if (pathWithoutOrgId.includes("/billing")) return "Billing";
  if (pathWithoutOrgId.includes("/reminders")) return "Reminders";

  return "Dashboard";
};

export function Header() {
  const { profile } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const currentOrgId = useOrgId();
  const { organization, loading, error } = useOrganizationContext();
  const pageTitle = getPageTitle(location.pathname);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/login");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
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
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <SidebarTrigger className="-ml-1" />

        <h1 className="text-xl md:text-2xl font-semibold truncate">{pageTitle}</h1>

        <div className="ml-auto flex items-center gap-2">
          <OrganizationSwitcher />
          <RoleSwitcher />
          <ThemeToggle />
          <NotificationsDropdown />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                  <AvatarFallback>{profile?.full_name ? getInitials(profile.full_name) : "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate(currentOrgId ? `/settings/${currentOrgId}/profile` : "/settings/profile")}
              >
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  navigate(currentOrgId ? `/settings/${currentOrgId}/organization` : "/settings/organization")
                }
              >
                Organization Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(currentOrgId ? `/billing/${currentOrgId}` : "/billing")}>
                Billing & Subscription
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
