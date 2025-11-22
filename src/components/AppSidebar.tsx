import { LayoutDashboard, Users, FileText, Inbox, Settings, Bell, Sparkles, Building2, ChevronDown, CheckSquare, Gift } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrgId } from "@/hooks/useOrgId";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";

const baseItems = [
  { title: "Dashboard", path: "dashboard", icon: LayoutDashboard },
  { title: "Clients", path: "clients", icon: Users },
  { title: "Forms", path: "forms", icon: FileText },
  { title: "Submissions", path: "submissions", icon: Inbox },
  { title: "Tasks", path: "tasks", icon: CheckSquare },
  { title: "Reminders", path: "reminders", icon: Bell },
  { title: "Early Access", path: "early-access-admin", icon: Gift },
  { title: "Settings", path: "settings", icon: Settings },
];

interface Organization {
  id: string;
  name: string;
}

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const orgId = useOrgId();
  const { user } = useUser();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const isCollapsed = state === "collapsed";

  // Fetch user organizations
  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  const fetchOrganizations = async () => {
    try {
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id, organizations(id, name)")
        .eq("user_id", user?.id);

      if (memberships) {
        const orgs = memberships
          .map((m: any) => m.organizations)
          .filter(Boolean)
          .map((org: any) => ({
            id: org.id,
            name: org.name || "Unnamed Organization",
          }));
        setOrganizations(orgs);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (newOrgId: string) => {
    const currentPath = location.pathname.split("/")[1];
    navigate(`/${currentPath}/${newOrgId}`);
  };

  // Build items with orgId
  const items = baseItems.map(item => ({
    ...item,
    url: orgId ? `/${item.path}/${orgId}` : `/${item.path}`
  }));

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      {/* Header with Logo and Org Switcher */}
      <SidebarHeader className="border-b">
        <div className="p-4">
          {!isCollapsed ? (
            <div className="space-y-3">
              <h1 className="text-xl font-bold text-primary">Kenly</h1>
              
              {/* Organization Switcher */}
              {organizations.length > 1 && orgId && !loading && (
                <Select value={orgId} onValueChange={handleOrgChange}>
                  <SelectTrigger className="w-full bg-muted/50 border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {org.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth ${
                          isActive 
                            ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Upgrade Footer */}
      <SidebarFooter className="border-t p-3">
        {!isCollapsed ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/5 gap-2"
            onClick={() => navigate(orgId ? `/settings/${orgId}` : "/settings")}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-xs">Upgrade to Pro</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-muted-foreground hover:text-primary"
            onClick={() => navigate(orgId ? `/settings/${orgId}` : "/settings")}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
