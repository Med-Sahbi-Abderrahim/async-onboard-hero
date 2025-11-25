import { useOrgBranding } from "@/hooks/useOrgBranding";
import { RoleSwitcher } from "@/components/RoleSwitcher";

interface BrandedHeaderProps {
  organizationId: string;
  className?: string;
}

export function BrandedHeader({ organizationId, className = "" }: BrandedHeaderProps) {
  const { branding, loading } = useOrgBranding(organizationId);

  if (loading || !branding) {
    return (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <div className="h-12 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-6 ${className}`}>
      <div className="flex-1" />
      
      <div className="flex items-center justify-center flex-1">
        {branding.logoUrl ? (
          <img 
            src={branding.logoUrl} 
            alt={branding.organizationName || "Organization"} 
            className="h-12 max-w-[200px] object-contain"
          />
        ) : (
          <h1 className="text-2xl font-bold">
            {branding.organizationName || "Client Portal"}
          </h1>
        )}
      </div>
      
      <div className="flex-1 flex justify-end">
        <RoleSwitcher />
      </div>
    </div>
  );
}
