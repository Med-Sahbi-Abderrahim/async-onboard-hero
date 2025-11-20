import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useFileDownload() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadFile = async (
    storagePath: string,
    fileName: string,
    bucket: string = "client-uploads"
  ) => {
    setDownloading(storagePath);
    
    try {
      // Generate a signed URL that expires in 1 hour
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 3600);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error("Failed to generate download URL");
      }

      // Fetch the file and trigger download
      const response = await fetch(data.signedUrl);
      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    } finally {
      setDownloading(null);
    }
  };

  return { downloadFile, downloading };
}