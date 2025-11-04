import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { User, Users, Bell, CreditCard, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsLayoutProps {
  children: ReactNode;
}

const settingsNavItems = [
  { title: 'Profile', path: '/settings/profile', icon: User },
  { title: 'Organization', path: '/settings/organization', icon: Building },
  { title: 'Team Members', path: '/settings/team', icon: Users },
  { title: 'Notifications', path: '/settings/notifications', icon: Bell },
  { title: 'Billing', path: '/billing', icon: CreditCard },
];

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const location = useLocation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Settings</h2>
        <p className="text-muted-foreground mt-2">
          Manage your account and organization settings
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1 bg-card rounded-lg border p-2">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
