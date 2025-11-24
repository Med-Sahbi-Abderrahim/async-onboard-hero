import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface FontSelectorProps {
  fontFamily: string;
  customFontUrl: string | null;
  customFontName: string | null;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  onFontChange: (fontFamily: string, customFontUrl?: string, customFontName?: string) => void;
}

const GOOGLE_FONTS = [
  { value: "Inter", label: "Inter (Default)" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
  { value: "Raleway", label: "Raleway" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Nunito", label: "Nunito" },
  { value: "Ubuntu", label: "Ubuntu" },
  { value: "Mukta", label: "Mukta" },
];

export function FontSelector({
  fontFamily,
  customFontUrl,
  customFontName,
  plan,
  onFontChange,
}: FontSelectorProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const canCustomizeFonts = plan === 'pro' || plan === 'enterprise';
  const canUploadCustomFonts = plan === 'enterprise';

  const handleFontChange = (value: string) => {
    onFontChange(value);
  };

  const handleCustomFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['font/woff', 'font/woff2', 'font/ttf', 'font/otf', 'application/x-font-woff', 'application/x-font-ttf'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['woff', 'woff2', 'ttf', 'otf'];

    if (!validExtensions.includes(fileExt || '')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid font file (.woff, .woff2, .ttf, or .otf)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `fonts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(filePath);

      const fontName = file.name.replace(/\.[^/.]+$/, "");
      onFontChange('custom', publicUrl, fontName);

      toast({
        title: "Custom font uploaded",
        description: "Your custom font has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="font-family">Font Family</Label>
        
        {!canCustomizeFonts ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Font customization is available on Pro and Enterprise plans. Upgrade to customize your portal's typography.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Select
              value={fontFamily}
              onValueChange={handleFontChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {GOOGLE_FONTS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
                {canUploadCustomFonts && customFontUrl && (
                  <SelectItem value="custom">
                    Custom Font: {customFontName || 'Uploaded Font'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {canUploadCustomFonts && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => document.getElementById('custom-font-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Custom Font'}
                </Button>
                <input
                  id="custom-font-upload"
                  type="file"
                  accept=".woff,.woff2,.ttf,.otf"
                  className="hidden"
                  onChange={handleCustomFontUpload}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enterprise only: Upload custom fonts (.woff, .woff2, .ttf, .otf)
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {canCustomizeFonts && fontFamily !== 'Inter' && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <p className="text-sm mb-2 font-semibold">Preview:</p>
          <p style={{ fontFamily: fontFamily === 'custom' ? customFontName || 'inherit' : fontFamily }}>
            The quick brown fox jumps over the lazy dog
          </p>
          <p style={{ fontFamily: fontFamily === 'custom' ? customFontName || 'inherit' : fontFamily }} className="text-2xl font-bold mt-2">
            ABCDEFGabcdefg 0123456789
          </p>
        </div>
      )}
    </div>
  );
}
