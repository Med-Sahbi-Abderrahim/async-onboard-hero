import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, JPG, PNG, and DOCX files are allowed",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File | null) => {
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const uploadFile = async (clientId: string, organizationId: string): Promise<boolean> => {
    if (!selectedFile) return false;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check storage limit
      const { data: canUpload, error: limitError } = await supabase.rpc("can_upload_file", {
        org_id: organizationId,
        file_size_bytes: selectedFile.size,
      });

      if (limitError) throw limitError;
      if (!canUpload) {
        return false; // Signal that upgrade is needed
      }

      const filePath = `${user.id}/${Date.now()}_${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("client-uploads")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("client_files").insert({
        client_id: clientId,
        organization_id: organizationId,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        storage_path: filePath,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      toast({
        title: "✅ File uploaded successfully",
        description: `${selectedFile.name} has been uploaded`,
      });

      setSelectedFile(null);
      return true;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "⚠️ Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => setSelectedFile(null);

  return {
    uploading,
    selectedFile,
    handleFileSelect,
    uploadFile,
    clearFile,
  };
}
