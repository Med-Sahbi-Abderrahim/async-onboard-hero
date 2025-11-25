import { useNavigate } from 'react-router-dom';
import { Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useUser } from '@/contexts/UserContext';
import { Badge } from '@/components/ui/badge';

export function RoleSwitcher() {
  const navigate = useNavigate();
  const { userMode, setUserMode } = useUser();
  const { isClient, isBusinessMember, clientOrganizations, businessOrganizations, loading } = useUserRoles();

  // Only show if user has both roles
  if (loading || (!isClient || !isBusinessMember)) {
    return null;
  }

  const handleSwitchToClient = () => {
    setUserMode('client');
    // Navigate to first client organization portal
    if (clientOrganizations.length > 0) {
      navigate(`/client-portal/${clientOrganizations[0].id}`);
    }
  };

  const handleSwitchToBusiness = () => {
    setUserMode('business');
    // Navigate to first business organization dashboard
    if (businessOrganizations.length > 0) {
      navigate(`/dashboard/${businessOrganizations[0].id}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {userMode === 'business' ? (
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
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch View
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSwitchToBusiness} disabled={userMode === 'business'}>
          <Building2 className="mr-2 h-4 w-4" />
          <div className="flex flex-col flex-1 gap-1">
            <div className="flex items-center justify-between">
              <span>Business Dashboard</span>
              {userMode === 'business' && (
                <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Manage your agency
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleSwitchToClient} disabled={userMode === 'client'}>
          <User className="mr-2 h-4 w-4" />
          <div className="flex flex-col flex-1 gap-1">
            <div className="flex items-center justify-between">
              <span>Client Portal</span>
              {userMode === 'client' && (
                <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              View your projects
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
