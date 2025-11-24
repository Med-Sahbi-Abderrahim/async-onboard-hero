import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, Eye, Upload } from 'lucide-react';
import { BrandingPreviewModal } from './BrandingPreviewModal';
import { FontSelector } from './FontSelector';
import { useOrgLimits } from '@/hooks/useOrgLimits';
import { UsageDashboard } from '@/components/usage/UsageDashboard';

interface Organization {
  id: string;
  name: string;
  slug: string;
  brand_color: string;
  logo_url: string | null;
  font_family: string;
  custom_font_url: string | null;
  custom_font_name: string | null;
  plan: string;
}

export function OrganizationSettings() {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgName, setOrgName] = useState('');
  const [brandColor, setBrandColor] = useState('#4F46E5');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [customFontUrl, setCustomFontUrl] = useState<string | null>(null);
  const [customFontName, setCustomFontName] = useState<string | null>(null);

  const { limits } = useOrgLimits(organization?.id);

  useEffect(() => {
    if (user) {
      fetchOrganization();
    }
  }, [user]);

  const fetchOrganization = async () => {
    try {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user?.id)
        .single();

      if (!membership) return;

      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', membership.organization_id)
        .single();

      if (error) throw error;

      setOrganization(org);
      setOrgName(org.name);
      setBrandColor(org.brand_color || '#4F46E5');
      setLogoUrl(org.logo_url);
      setFontFamily(org.font_family || 'Inter');
      setCustomFontUrl(org.custom_font_url);
      setCustomFontName(org.custom_font_name);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFontChange = (font: string, customUrl?: string, customName?: string) => {
    setFontFamily(font);
    if (customUrl) setCustomFontUrl(customUrl);
    if (customName) setCustomFontName(customName);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      toast({
        title: 'Logo uploaded',
        description: 'Your logo has been uploaded successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!organization) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgName,
          brand_color: brandColor,
          logo_url: logoUrl,
          font_family: fontFamily,
          custom_font_url: customFontUrl,
          custom_font_name: customFontName,
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Organization settings updated',
      });
      await fetchOrganization();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No organization found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization Details
          </CardTitle>
          <CardDescription>
            Manage your organization's name and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="My Organization"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Organization Slug</Label>
            <Input
              id="slug"
              value={organization.slug}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Organization slug cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo-upload">Organization Logo</Label>
            <div className="flex items-center gap-4">
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt="Organization Logo" 
                  className="h-12 w-12 object-contain rounded border" 
                />
              )}
              <Button
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById('org-logo-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <input
                id="org-logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Upload your organization logo to display in the client portal
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandColor">Brand Color</Label>
            <div className="flex gap-3">
              <Input
                id="brandColor"
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#4F46E5"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Choose a color that matches your brand
            </p>
          </div>

          <FontSelector
            fontFamily={fontFamily}
            customFontUrl={customFontUrl}
            customFontName={customFontName}
            plan={(limits?.plan || organization.plan) as 'free' | 'starter' | 'pro' | 'enterprise'}
            onFontChange={handleFontChange}
          />

          <div className="flex gap-3">
            <Button onClick={handleSaveOrganization} disabled={saving || !orgName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview Portal
            </Button>
          </div>
        </CardContent>
      </Card>

      <UsageDashboard organizationId={organization.id} />

      <BrandingPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        organizationId={organization.id}
        organizationName={orgName}
        logoUrl={logoUrl}
        brandColor={brandColor}
      />
    </div>
  );
}
