import React, { createContext, useContext, ReactNode } from 'react';
import { useOrganization } from '../hooks/useOrganization';
import type { OrganizationBranding } from '../hooks/useOrganization';

interface OrganizationContextType {
  organization: OrganizationBranding | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const organizationData = useOrganization();

  return (
    <OrganizationContext.Provider value={organizationData}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within OrganizationProvider');
  }
  return context;
}
