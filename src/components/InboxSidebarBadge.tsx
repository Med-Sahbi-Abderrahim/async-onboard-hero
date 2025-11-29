import { useClientRequests } from "@/hooks/useClientRequests";

export function InboxSidebarBadge({ organizationId }) {
  const { pendingCount } = useClientRequests(organizationId);
  
  if (pendingCount === 0) return null;
  
  return (
    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
      {pendingCount > 99 ? '99+' : pendingCount}
    </span>
  );
}
