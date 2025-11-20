import { LayoutDashboard, Users, FileText, Inbox, Settings, Bell, Sparkles } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrgId } from "@/hooks/useOrgId";

const baseItems = [
  { title: "Dashboard", path: "dashboard", icon: LayoutDashboard },
  { title: "Clients", path: "clients", icon: Users },
  { title: "Forms", path: "forms", icon: FileText },
  { title: "Submissions", path: "submissions", icon: Inbox },
  { title: "Reminders", path: "reminders", icon: Bell },
  { title: "Settings", path: "settings", icon: Settings },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const orgId = useOrgId();

  const isCollapsed = state === "collapsed";

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
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="p-6">{!isCollapsed && <h1 className="text-2xl font-bold text-primary">Kenly</h1>}</div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive ? "bg-accent text-accent-foreground border-l-4 border-primary" : "hover:bg-accent/50"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Upgrade Card */}
        {!isCollapsed && (
          <div className="p-4 mt-auto">
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">Upgrade to Pro</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Unlock unlimited forms and advanced features
                  </p>
                </div>
              </div>
              <Button 
                variant="default" 
                size="sm" 
                className="w-full" 
                onClick={() => navigate(orgId ? `/settings/${orgId}` : "/settings")}
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
