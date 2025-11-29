import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Download, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useFileDownload } from "@/hooks/useFileDownload";
import { BrandedFooter } from "@/components/BrandedFooter";
import { useClientData } from "@/hooks/useClientData";
import { useClientFiles } from "@/hooks/useSharedData";
import { useToast } from "@/hooks/use-toast";

export default function ClientPortalFiles() {
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const { toast } = useToast();
  const { downloadFile: downloadFileSecure, downloading } = useFileDownload();
  const { client, loading: clientLoading } = useClientData(orgId);
  const { files, loading, refresh } = useClientFiles(client?.id, client?.organization_id, true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<"free" | "starter" | "pro">("free");

  useEffect(() => {
    if (client) {
      loadOrgPlan();
    }
  }, [client]);

  const loadOrgPlan = async () => {
    if (!client) return;

    try {
      const { data: orgData, error } = await supabase
        .from("organizations")
        .select("plan")
        .eq("id", client.organization_id)
        .single();

      if (error) {
        console.error("Error loading org plan:", error);
        return;
      }

      if (orgData) {
        setCurrentPlan(orgData.plan as "free" | "starter" | "pro");
      }
    } catch (error) {
      console.error("Error in loadOrgPlan:", error);
    }
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      toast({
        title: "⚠️ File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return false;
    }

    // Allow most common file types
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "application/zip",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "⚠️ File type not allowed",
        description: "Please upload a supported file type",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !client) return;

    setUploading(true);

    try {
      // Get authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to upload files");
      }

      // Check storage limit
      const { data: canUpload, error: limitError } = await supabase.rpc("can_upload_file", {
        org_id: client.organization_id,
        file_size_bytes: selectedFile.size,
      });

      if (limitError) {
        console.error("Error checking upload limit:", limitError);
        throw limitError;
      }

      if (!canUpload) {
        setShowUpgradeModal(true);
        return;
      }

      // Generate unique file path
      const fileExt = selectedFile.name.split(".").pop() || "bin";
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${client.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage.from("client-uploads").upload(filePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        throw uploadError;
      }

      // Insert file record
      const { data: fileRecord, error: dbError } = await supabase
        .from("client_files")
        .insert({
          client_id: client.id,
          organization_id: client.organization_id,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          storage_path: filePath,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Error creating file record:", dbError);
        throw dbError;
      }

      if (!fileRecord) {
        throw new Error("Failed to create file record");
      }

      // 1. Insert into client_requests table
      const { data: request, error: requestError } = await supabase
        .from("client_requests")
        .insert({
          client_id: client.id,
          organization_id: client.organization_id,
          request_type: "file_access",
          title: `File Uploaded: ${selectedFile.name}`,
          status: "pending",
          metadata: {
            file_id: fileRecord.id,
            file_name: selectedFile.name,
            file_size: selectedFile.size,
            file_type: selectedFile.type,
          },
        })
        .select()
        .single();

      if (requestError) {
        console.error("Error creating file request:", requestError);
        // Don't fail if request creation fails - file is already uploaded
        console.warn("File uploaded but request tracking may have failed");
      } else if (request) {
        // 2. Trigger notification to organization
        try {
          await supabase.functions.invoke("send-org-notification", {
            body: {
              organizationId: client.organization_id,
              clientId: client.id,
              requestType: "file_access",
              requestId: request.id,
              title: `File Uploaded: ${selectedFile.name}`,
              details: {
                file_id: fileRecord.id,
                file_name: selectedFile.name,
                file_size: selectedFile.size,
                file_size_mb: (selectedFile.size / 1024 / 1024).toFixed(2),
              },
            },
          });
        } catch (notificationError) {
          console.error("Error sending notification:", notificationError);
          console.warn("File uploaded but notification delivery may have failed");
        }
      }

      toast({
        title: "✅ File uploaded successfully",
        description: `${selectedFile.name} has been uploaded and shared with your team`,
      });

      setSelectedFile(null);
      refresh();
    } catch (error: any) {
      console.error("Error in handleUpload:", error);
      toast({
        title: "⚠️ Upload failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (file: any) => {
    downloadFileSecure(file.storage_path, file.file_name, "client-uploads");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (clientLoading) {
    return (
      <div className="min-h-screen gradient-hero p-4 md:p-8 animate-fade-in flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen gradient-hero p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">
            <p>Unable to load client information</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero p-4 md:p-8 animate-fade-in flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4 animate-slide-up">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:scale-110 transition-transform"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Files</h1>
              <p className="text-sm text-muted-foreground">Upload and manage your documents</p>
            </div>
          </div>

          <Card
            className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10 hover:shadow-medium transition-all"
            style={{ animationDelay: "0.1s" }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl gradient-primary p-2.5 shadow-soft">
                  <Upload className="h-5 w-5 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">Upload Files</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="file-upload" className="text-sm font-medium text-foreground block">
                  Select File
                </label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="border-primary/20 focus:border-primary transition-colors cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, Word, Excel, Images, ZIP (Max 50MB)
                </p>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="ml-3 hover:scale-105 transition-transform"
                    size="sm"
                  >
                    {uploading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-pulse" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10"
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader>
              <CardTitle className="text-xl">Your Files</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="rounded-full bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-10 w-10 text-primary/50" />
                  </div>
                  <p className="text-lg font-medium mb-1">No files uploaded yet</p>
                  <p className="text-sm">Upload your first file to share with your team</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 border border-primary/10 rounded-xl hover:shadow-medium hover:scale-[1.01] transition-all duration-200 bg-background/50 group"
                      style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(file)}
                        disabled={downloading === file.storage_path}
                        className="hover:scale-110 transition-transform flex-shrink-0"
                      >
                        {downloading === file.storage_path ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <BrandedFooter organizationId={client.organization_id} />

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        limitType="storage"
        currentPlan={currentPlan}
        organizationId={client.organization_id}
      />
    </div>
  );
}
