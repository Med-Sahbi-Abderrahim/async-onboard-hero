import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportSubmissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function ImportSubmissionsModal({ open, onOpenChange, onImportComplete }: ImportSubmissionsModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an Excel (.xlsx, .xls) or CSV file',
          variant: 'destructive',
        });
        return;
      }
      
      setFile(selectedFile);
      setImportStatus(null);
    }
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setImporting(true);
    setProgress(0);

    try {
      // Get organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (!membership) {
        throw new Error('Organization not found');
      }

      // Parse file
      const rows = await parseExcelFile(file);
      
      if (rows.length === 0) {
        throw new Error('No data found in file');
      }

      const results = {
        total: rows.length,
        successful: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Import each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setProgress(((i + 1) / rows.length) * 100);

        try {
          // Validate required fields
          if (!row.client_email || !row.form_slug) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: Missing client_email or form_slug`);
            continue;
          }

          // Find or create client
          let { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('organization_id', membership.organization_id)
            .eq('email', row.client_email)
            .is('deleted_at', null)
            .maybeSingle();

          if (!client) {
            const { data: newClient, error: clientError } = await supabase
              .from('clients')
              .insert({
                organization_id: membership.organization_id,
                email: row.client_email,
                full_name: row.client_name || row.client_email,
                invited_by: user.id,
              })
              .select()
              .single();

            if (clientError) throw clientError;
            client = newClient;
          }

          // Find form
          const { data: form } = await supabase
            .from('intake_forms')
            .select('id')
            .eq('organization_id', membership.organization_id)
            .eq('slug', row.form_slug)
            .maybeSingle();

          if (!form) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: Form '${row.form_slug}' not found`);
            continue;
          }

          // Parse responses (all columns except client_email, client_name, form_slug, status)
          const responses: Record<string, any> = {};
          Object.keys(row).forEach((key) => {
            if (!['client_email', 'client_name', 'form_slug', 'status'].includes(key)) {
              responses[key] = row[key];
            }
          });

          // Create submission
          const { error: submissionError } = await supabase
            .from('form_submissions')
            .insert({
              organization_id: membership.organization_id,
              client_id: client.id,
              intake_form_id: form.id,
              responses: responses,
              status: row.status || 'pending',
              completion_percentage: 100,
              submitted_at: new Date().toISOString(),
            });

          if (submissionError) throw submissionError;
          results.successful++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      setImportStatus(results);

      toast({
        title: 'Import complete',
        description: `Successfully imported ${results.successful} of ${results.total} submissions`,
      });

      if (results.successful > 0) {
        onImportComplete();
      }
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setProgress(0);
    setImportStatus(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Submissions</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import submissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!importStatus ? (
            <>
              {/* File Upload */}
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-2">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-primary" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">
                      Excel (.xlsx, .xls) or CSV files
                    </p>
                  </div>
                )}
              </div>

              {/* Progress */}
              {importing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Importing...</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Template Info */}
              <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Expected Format</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Your file should include the following columns:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• <code className="bg-muted px-1 rounded">client_email</code> (required)</li>
                  <li>• <code className="bg-muted px-1 rounded">client_name</code> (optional)</li>
                  <li>• <code className="bg-muted px-1 rounded">form_slug</code> (required)</li>
                  <li>• <code className="bg-muted px-1 rounded">status</code> (optional: pending, in_progress, completed)</li>
                  <li>• Additional columns will be imported as form field responses</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose} disabled={importing}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={!file || importing}>
                  {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Import
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Import Results */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{importStatus.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-4 bg-success/10 border border-success/20 rounded-lg">
                    <div className="text-2xl font-bold text-completed">{importStatus.successful}</div>
                    <div className="text-sm text-muted-foreground">Success</div>
                  </div>
                  <div className="text-center p-4 bg-blocked/10 border border-blocked/20 rounded-lg">
                    <div className="text-2xl font-bold text-blocked">{importStatus.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>

                {importStatus.errors.length > 0 && (
                  <div className="border border-destructive rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <h4 className="font-medium text-sm">Errors</h4>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {importStatus.errors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {importStatus.successful > 0 && (
                  <div className="flex items-center gap-2 text-completed text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Import completed successfully</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleClose}>Done</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
