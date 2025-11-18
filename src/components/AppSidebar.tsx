import { LayoutDashboard, Users, FileText, Inbox, Settings, Bell } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Forms", url: "/forms", icon: FileText },
  { title: "Submissions", url: "/submissions", icon: Inbox },
  { title: "Reminders", url: "/reminders", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const isCollapsed = state === "collapsed";

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
            <Card className="bg-gradient-primary border-0">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">Upgrade to Pro</h3>
                <p className="text-sm text-white/80 mb-3">Unlock unlimited forms and advanced features</p>
                <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate("/settings")}>
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
