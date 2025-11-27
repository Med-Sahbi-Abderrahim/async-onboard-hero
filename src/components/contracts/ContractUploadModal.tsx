import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

type ContractType = Database["public"]["Enums"]["contract_type"];

interface ContractUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  organizationId: string;
  onSuccess: () => void;
}

export function ContractUploadModal({
  open,
  onOpenChange,
  clientId,
  organizationId,
  onSuccess,
}: ContractUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    contract_type: ContractType;
    effective_date: string;
    expiration_date: string;
    amount_cents: string;
  }>({
    title: "",
    description: "",
    contract_type: "other",
    effective_date: "",
    expiration_date: "",
    amount_cents: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Only PDF and DOCX files are allowed");
        return;
      }
      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${organizationId}/${clientId}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create contract record
      const { error: dbError } = await supabase
        .from("contracts")
        .insert({
          client_id: clientId,
          organization_id: organizationId,
          title: formData.title,
          description: formData.description || null,
          contract_type: formData.contract_type,
          effective_date: formData.effective_date || null,
          expiration_date: formData.expiration_date || null,
          amount_cents: formData.amount_cents ? parseInt(formData.amount_cents) : null,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
          status: "draft",
        });

      if (dbError) throw dbError;

      toast.success("Contract uploaded successfully");
      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFile(null);
      setFormData({
        title: "",
        description: "",
        contract_type: "other",
        effective_date: "",
        expiration_date: "",
        amount_cents: "",
      });
    } catch (error: any) {
      console.error("Error uploading contract:", error);
      toast.error(error.message || "Failed to upload contract");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Contract</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="file">Contract File (PDF or DOCX)</Label>
            <div className="mt-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                required
              />
              {file && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="title">Contract Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Service Agreement 2024"
              required
            />
          </div>

          <div>
            <Label htmlFor="contract_type">Contract Type</Label>
            <Select
              value={formData.contract_type}
              onValueChange={(value) => setFormData({ ...formData, contract_type: value as ContractType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nda">NDA</SelectItem>
                <SelectItem value="service_agreement">Service Agreement</SelectItem>
                <SelectItem value="consulting_agreement">Consulting Agreement</SelectItem>
                <SelectItem value="master_service_agreement">Master Service Agreement</SelectItem>
                <SelectItem value="sow">Statement of Work</SelectItem>
                <SelectItem value="amendment">Amendment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contract details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="effective_date">Effective Date</Label>
              <Input
                id="effective_date"
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expiration_date">Expiration Date</Label>
              <Input
                id="expiration_date"
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Contract Amount (Optional)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount_cents ? (parseInt(formData.amount_cents) / 100).toString() : ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount_cents: e.target.value ? (parseFloat(e.target.value) * 100).toString() : "",
                  })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Contract
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
