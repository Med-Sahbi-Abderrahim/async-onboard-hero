import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";

interface ClientFormFieldProps {
  field: any;
  value: any;
  error?: string;
  onChange: (value: any) => void;
  organizationId: string;
  submissionId?: string;
}

export function ClientFormField({
  field,
  value,
  error,
  onChange,
  organizationId,
  submissionId,
}: ClientFormFieldProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${organizationId}/${submissionId || "temp"}/${field.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("submissions")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("submissions")
        .getPublicUrl(fileName);

      // Store file metadata if submission exists
      if (submissionId) {
        await supabase.from("submission_files").insert({
          organization_id: organizationId,
          submission_id: submissionId,
          field_id: field.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: fileName,
          storage_bucket: "submissions",
        });
      }

      onChange({
        url: publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      });

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileRemove = () => {
    onChange(null);
  };

  const fieldLabel = (
    <Label htmlFor={field.id} className="text-base">
      {field.label}
      {field.required && <span className="text-destructive ml-1">*</span>}
    </Label>
  );

  const renderField = () => {
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={field.id}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={error ? "border-destructive" : ""}
          />
        );

      case "select":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger className={error ? "border-destructive" : ""}>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={onChange}
            />
            <Label htmlFor={field.id} className="cursor-pointer font-normal">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );

      case "file":
        return (
          <div className="space-y-2">
            {value ? (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm truncate flex-1">{value.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFileRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  id={field.id}
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Label htmlFor={field.id} className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {uploading ? "Uploading..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum file size: 50MB
                  </p>
                </Label>
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            id={field.id}
            type={field.type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={error ? "border-destructive" : ""}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {field.type !== "checkbox" && fieldLabel}
      {renderField()}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
