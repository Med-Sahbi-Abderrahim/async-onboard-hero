import { useUser } from "@/contexts/UserContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useOrgBranding } from "@/hooks/useOrgBranding";
import { useOrgId } from "@/hooks/useOrgId";
import { Button } from "@/components/ui/button";
import { Building2, User, LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  const { user, profile, userMode, setUserMode } = useUser();
  const { isClient, isBusinessMember, clientOrganizations, businessOrganizations } = useUserRoles();
  const orgId = useOrgId();
  const { branding, loading: brandingLoading } = useOrgBranding(orgId);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleSwitchToClient = () => {
    setUserMode("client");
    if (clientOrganizations.length > 0) {
      navigate(`/client-portal/${clientOrganizations[0].id}`);
    }
  };

  const handleSwitchToBusiness = () => {
    setUserMode("business");
    if (businessOrganizations.length > 0) {
      navigate(`/dashboard/${businessOrganizations[0].id}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Show loading state while branding loads
  if (brandingLoading) {
    return (
      <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </header>
    );
  }

  return (
    <header
      className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6"
      style={{
        fontFamily: branding?.fontFamily || "Inter",
      }}
    >
      {/* Mobile menu trigger */}
      <SidebarTrigger className="-ml-1" />

      {/* Organization branding - centered */}
      <div className="flex-1 flex items-center justify-center">
        {branding?.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={branding.organizationName || "Organization"}
            className="h-8 max-w-[200px] object-contain"
          />
        ) : (
          <h1 className="text-xl font-bold">{branding?.organizationName || "Dashboard"}</h1>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Organization Switcher - only show if user has multiple orgs */}
        <OrganizationSwitcher />

        {/* Role Switcher - only show if user has both roles */}
        {isClient && isBusinessMember && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {userMode === "business" ? (
                  <>
                    <Building2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Business</span>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Client</span>
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Switch View</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleSwitchToBusiness}
                disabled={userMode === "business"}
                className="cursor-pointer"
              >
                <Building2 className="mr-2 h-4 w-4" />
                <div className="flex flex-col flex-1 gap-1">
                  <span>Business Dashboard</span>
                  <span className="text-xs text-muted-foreground">Manage your agency</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleSwitchToClient}
                disabled={userMode === "client"}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <div className="flex flex-col flex-1 gap-1">
                  <span>Client Portal</span>
                  <span className="text-xs text-muted-foreground">View your projects</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Notifications */}
        <NotificationsDropdown />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>{profile?.full_name ? getInitials(profile.full_name) : "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{profile?.email || user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate(orgId ? `/settings/${orgId}/profile` : "/settings/profile")}
              className="cursor-pointer"
            >
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(orgId ? `/settings/${orgId}/organization` : "/settings/organization")}
              className="cursor-pointer"
            >
              Organization Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
