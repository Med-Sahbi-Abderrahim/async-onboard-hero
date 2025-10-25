import { FormTemplate } from "@/data/templates/formTemplates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface FormCustomizerProps {
  template: FormTemplate;
  title: string;
  description: string;
  logoUrl: string;
  primaryColor: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onLogoChange: (url: string) => void;
  onColorChange: (color: string) => void;
}

export function FormCustomizer({
  template,
  title,
  description,
  logoUrl,
  primaryColor,
  onTitleChange,
  onDescriptionChange,
  onLogoChange,
  onColorChange,
}: FormCustomizerProps) {
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

      const { error: uploadError, data } = await supabase.storage
        .from("organization-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("organization-assets")
        .getPublicUrl(filePath);

      onLogoChange(publicUrl);
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
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="form-title">Form Title</Label>
        <Input
          id="form-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter form title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="form-description">Description</Label>
        <Textarea
          id="form-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter form description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo-upload">Logo</Label>
        <div className="flex items-center gap-4">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain" />
          )}
          <Button
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById("logo-upload")?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload Logo"}
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
            value={primaryColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={primaryColor}
            onChange={(e) => onColorChange(e.target.value)}
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );
}
