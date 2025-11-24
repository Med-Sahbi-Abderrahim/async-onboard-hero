import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OrgBranding {
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  brandingLevel: 'full' | 'standard' | 'custom' | 'none';
  logoUrl: string | null;
  brandColor: string | null;
  allowCustomColors: boolean;
  showKenlyBadge: boolean;
  organizationName: string | null;
}

export function useOrgBranding(organizationId?: string) {
  const [branding, setBranding] = useState<OrgBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      fetchBranding(organizationId);
    }
  }, [organizationId]);

  const fetchBranding = async (orgId: string) => {
    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .select('plan, branding_level, logo_url, brand_color, name')
        .eq('id', orgId)
        .single();

      if (error) throw error;

      const brandingLevel = org.branding_level as 'full' | 'standard' | 'custom' | 'none';

      // Determine branding rules based on plan
      const allowCustomColors = brandingLevel === 'custom' || brandingLevel === 'none';
      const showKenlyBadge = brandingLevel === 'full';

      setBranding({
        plan: org.plan as 'free' | 'starter' | 'pro' | 'enterprise',
        brandingLevel,
        logoUrl: org.logo_url,
        brandColor: org.brand_color,
        allowCustomColors,
        showKenlyBadge,
        organizationName: org.name,
      });
    } catch (error) {
      console.error('Error fetching branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyBranding = () => {
    if (!branding || !branding.allowCustomColors || !branding.brandColor) return;

    // Apply custom brand color to CSS variables if custom colors are allowed
    const root = document.documentElement;
    const hexToHsl = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return null;
      
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    const hslColor = hexToHsl(branding.brandColor);
    if (hslColor) {
      root.style.setProperty('--primary', hslColor);
    }
  };

  useEffect(() => {
    applyBranding();
  }, [branding]);

  return {
    branding,
    loading,
  };
}
