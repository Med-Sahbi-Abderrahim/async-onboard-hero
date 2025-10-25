import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Branding {
  logo_url?: string;
  primary_color: string;
  font_family?: string;
}

interface FormBrandingSectionProps {
  branding: Branding;
  onChange: (branding: Branding) => void;
}

const FONTS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
];

export function FormBrandingSection({ branding, onChange }: FormBrandingSectionProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("organization-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("organization-assets")
        .getPublicUrl(filePath);

      onChange({ ...branding, logo_url: publicUrl });
      toast({
        title: "Logo uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Branding</h3>

      <div className="space-y-2">
        <Label htmlFor="logo-upload">Logo</Label>
        <div className="flex items-center gap-4">
          {branding.logo_url && (
            <img src={branding.logo_url} alt="Logo" className="h-12 w-12 object-contain rounded border" />
          )}
          <Button
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById("logo-upload")?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : branding.logo_url ? "Change Logo" : "Upload Logo"}
          </Button>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="primary-color">Primary Color</Label>
        <div className="flex items-center gap-4">
          <Input
            id="primary-color"
            type="color"
            value={branding.primary_color}
            onChange={(e) => onChange({ ...branding, primary_color: e.target.value })}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={branding.primary_color}
            onChange={(e) => onChange({ ...branding, primary_color: e.target.value })}
            placeholder="#007bff"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="font-family">Font Family</Label>
        <Select
          value={branding.font_family || "Inter"}
          onValueChange={(value) => onChange({ ...branding, font_family: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
