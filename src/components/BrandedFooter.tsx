import { useOrgBranding } from "@/hooks/useOrgBranding";

interface BrandedFooterProps {
  organizationId: string;
  className?: string;
}

export function BrandedFooter({ organizationId, className = "" }: BrandedFooterProps) {
  const { branding, loading } = useOrgBranding(organizationId);

  if (loading || !branding) return null;

  // Don't show footer for enterprise (none) or pro (custom) plans
  if (!branding.showKenlyBadge) return null;

  return (
    <footer className={`py-6 text-center text-sm text-muted-foreground border-t ${className}`}>
      <div className="flex items-center justify-center gap-2">
        <span>Powered by</span>
        <img 
          src="/favicon-32x32.png" 
          alt="Kenly" 
          className="h-5 w-5 object-contain"
        />
        <span className="font-semibold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Kenly
        </span>
      </div>
    </footer>
  );
}
