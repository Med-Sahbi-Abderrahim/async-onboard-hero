import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

interface ImportClientsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  userId: string;
  onImportComplete: () => void;
}

interface ImportResult {
  success: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; email: string; error: string }>;
}

export function ImportClientsModal({
  open,
  onOpenChange,
  organizationId,
  userId,
  onImportComplete,
}: ImportClientsModalProps) {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls") && !fileName.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel (.xlsx, .xls) or CSV file",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (jsonData.length === 0) {
        throw new Error("The file is empty or has no valid data");
      }

      // Validate headers
      const firstRow = jsonData[0] as any;
      if (!firstRow.email && !firstRow.Email) {
        throw new Error("Missing required 'email' column in the file");
      }

      const importResult: ImportResult = {
        success: 0,
        updated: 0,
        failed: 0,
        errors: [],
      };

      // Process each row
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        const email = (row.email || row.Email || "").toString().trim().toLowerCase();

        setProgress(Math.round(((i + 1) / jsonData.length) * 100));

        // Validate email
        if (!email) {
          importResult.failed++;
          importResult.errors.push({
            row: i + 2, // +2 because row 1 is header and arrays start at 0
            email: email || "(empty)",
            error: "Email is required",
          });
          continue;
        }

        if (!validateEmail(email)) {
          importResult.failed++;
          importResult.errors.push({
            row: i + 2,
            email,
            error: "Invalid email format",
          });
          continue;
        }

        // Extract client data
        const clientData = {
          email,
          full_name: (row.full_name || row["Full Name"] || row.name || row.Name || "").toString().trim(),
          phone: (row.phone || row.Phone || "").toString().trim() || null,
          company_name: (row.company_name || row["Company Name"] || row.company || row.Company || "").toString().trim() || null,
          tags: row.tags ? (typeof row.tags === "string" ? row.tags.split(",").map((t: string) => t.trim()) : []) : [],
          organization_id: organizationId,
          invited_by: userId,
        };

        try {
          // Check if client exists
          const { data: existingClient } = await supabase
            .from("clients")
            .select("id")
            .eq("organization_id", organizationId)
            .eq("email", email)
            .is("deleted_at", null)
            .maybeSingle();

          if (existingClient) {
            // Update existing client
            const updateData: any = {
              updated_at: new Date().toISOString(),
            };
            
            if (clientData.full_name) updateData.full_name = clientData.full_name;
            if (clientData.phone !== null) updateData.phone = clientData.phone;
            if (clientData.company_name !== null) updateData.company_name = clientData.company_name;
            if (clientData.tags.length > 0) updateData.tags = clientData.tags;

            const { error } = await supabase
              .from("clients")
              .update(updateData)
              .eq("id", existingClient.id);

            if (error) throw error;
            importResult.updated++;
          } else {
            // Create new client
            const { error } = await supabase
              .from("clients")
              .insert(clientData);

            if (error) throw error;
            importResult.success++;
          }
        } catch (error: any) {
          importResult.failed++;
          importResult.errors.push({
            row: i + 2,
            email,
            error: error.message || "Failed to import",
          });
        }
      }

      setResult(importResult);

      if (importResult.success > 0 || importResult.updated > 0) {
        toast({
          title: "Import completed",
          description: `${importResult.success} new clients added, ${importResult.updated} updated`,
        });
        onImportComplete();
      } else {
        toast({
          title: "Import failed",
          description: "No clients were imported. Please check the errors below.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleClose = () => {
    if (!importing) {
      setResult(null);
      setProgress(0);
      onOpenChange(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        email: "client@example.com",
        full_name: "John Doe",
        phone: "+1234567890",
        company_name: "Acme Corp",
        tags: "vip, priority",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
    XLSX.writeFile(workbook, "client_import_template.xlsx");

    toast({
      title: "Template downloaded",
      description: "Use this template to format your client data",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Clients</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to add or update clients in your organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!importing && !result && (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required column:</strong> email
                  <br />
                  <strong>Optional columns:</strong> full_name, phone, company_name, tags
                  <br />
                  <small className="text-muted-foreground">
                    Existing clients (matched by email) will be updated
                  </small>
                </AlertDescription>
              </Alert>

              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Download Template
              </Button>

              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="client-file-upload"
                />
                <label htmlFor="client-file-upload">
                  <Button asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
                <p className="text-sm text-muted-foreground mt-2">
                  Supports Excel (.xlsx, .xls) and CSV files
                </p>
              </div>
            </>
          )}

          {importing && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Processing clients...</p>
              </div>
              <Progress value={progress} />
              <p className="text-center text-sm font-medium">{progress}%</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-success/10 border border-success/20 rounded-lg">
                  <CheckCircle2 className="h-8 w-8 text-completed mx-auto mb-2" />
                  <p className="text-2xl font-bold text-completed">{result.success}</p>
                  <p className="text-sm text-muted-foreground">Added</p>
                </div>
                <div className="text-center p-4 bg-info/10 border border-info/20 rounded-lg">
                  <CheckCircle2 className="h-8 w-8 text-in-progress mx-auto mb-2" />
                  <p className="text-2xl font-bold text-in-progress">{result.updated}</p>
                  <p className="text-sm text-muted-foreground">Updated</p>
                </div>
                <div className="text-center p-4 bg-blocked/10 border border-blocked/20 rounded-lg">
                  <XCircle className="h-8 w-8 text-blocked mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blocked">{result.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-60 overflow-y-auto">
                  <h4 className="font-medium mb-2">Errors:</h4>
                  {result.errors.map((error, idx) => (
                    <Alert key={idx} variant="destructive" className="mb-2">
                      <AlertDescription className="text-sm">
                        <strong>Row {error.row}:</strong> {error.email} - {error.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
