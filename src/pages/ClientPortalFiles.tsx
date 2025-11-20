import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, ArrowLeft, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useFileDownload } from "@/hooks/useFileDownload";

export default function ClientPortalFiles() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { downloadFile: downloadFileSecure, downloading } = useFileDownload();
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [client, setClient] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'starter' | 'pro'>('free');

  useEffect(() => {
    loadClientAndFiles();
  }, []);

  const loadClientAndFiles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to access your files",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const { data: clientData, error } = await supabase
      .from("clients")
      .select("id, organization_id, full_name")
      .eq("id", user.id)
      .single();

    if (error || !clientData) {
      toast({
        title: "Access denied",
        description: "Client account not found",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setClient(clientData);
    setClientId(clientData.id);
    loadFiles(clientData.id);
  };

  const loadFiles = async (cId: string) => {
    const { data, error } = await supabase
      .from("client_files")
      .select("*")
      .eq("client_id", cId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading files:", error);
      return;
    }
    setFiles(data || []);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, JPG, PNG, and DOCX files are allowed",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !clientId || !client) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get organization plan and check storage
      const { data: orgData } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', client.organization_id)
        .single();

      if (orgData) {
        setCurrentPlan(orgData.plan as 'free' | 'starter' | 'pro');
      }

      // Check storage limit
      const { data: canUpload, error: limitError } = await supabase
        .rpc('can_upload_file', {
          org_id: client.organization_id,
          file_size_bytes: selectedFile.size
        });

      if (limitError) throw limitError;

      if (!canUpload) {
        setUploading(false);
        setShowUpgradeModal(true);
        return;
      }

      const filePath = `${user.id}/${Date.now()}_${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("client-uploads")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("client_files")
        .insert({
          client_id: clientId,
          organization_id: client.organization_id,
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
      loadFiles(clientId);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "⚠️ Upload failed",
        description: error.message,
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

  return (
    <div className="min-h-screen gradient-hero p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 animate-slide-up">
          <Button variant="ghost" size="icon" onClick={() => navigate("/client-portal")} className="hover:scale-110 transition-transform">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Files</h1>
            <p className="text-sm text-muted-foreground">Upload and manage your documents</p>
          </div>
        </div>

        <Card className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10 hover:shadow-medium transition-all" style={{ animationDelay: '0.1s' }}>
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
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onChange={handleFileSelect}
                disabled={uploading}
                className="border-primary/20 focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground">Accepted formats: PDF, JPG, PNG, DOCX (max 10MB)</p>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button 
                  onClick={handleSubmit} 
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
                    "Submit"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="text-xl">Your Files</CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground animate-fade-in">
                <div className="rounded-full bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-primary/50" />
                </div>
                <p className="text-lg font-medium mb-1">No files yet</p>
                <p className="text-sm">Upload your first file above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div 
                    key={file.id} 
                    className="flex items-center justify-between p-4 border border-primary/10 rounded-xl hover:shadow-medium hover:scale-[1.01] transition-all duration-200 bg-background/50 group"
                    style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/20 transition-colors">
                        <FileText className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-base">{file.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleDownload(file)} 
                      disabled={downloading === file.storage_path}
                      className="hover:scale-110 transition-transform"
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

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        limitType="storage"
        currentPlan={currentPlan}
        organizationId={client?.organization_id || ''}
      />
    </div>
  );
}
