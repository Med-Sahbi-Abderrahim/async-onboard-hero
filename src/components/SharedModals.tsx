// ============================================
// UPDATED AddTaskModal with Sharing Options
// ============================================
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddTaskModalProps {
  clientId?: string; // Optional - if provided, task is for specific client
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTaskModal({ clientId, organizationId, onClose, onSuccess }: AddTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [shareWithAllClients, setShareWithAllClients] = useState(!clientId); // Default to shared if no client specified
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: undefined as Date | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("tasks").insert({
        // If shareWithAllClients is true, set client_id to null (org-wide)
        // Otherwise use the provided clientId
        client_id: shareWithAllClients ? null : clientId,
        organization_id: organizationId,
        title: formData.title,
        description: formData.description || null,
        due_date: formData.due_date?.toISOString() || null,
        status: "pending",
        created_by: userData.user?.id,
        is_shared_with_all_clients: shareWithAllClients, // Optional: if using the sharing flag approach
      });

      if (error) throw error;

      toast.success(
        shareWithAllClients 
          ? "Task created and shared with all clients" 
          : "Task created for specific client"
      );
      onSuccess();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          {/* Sharing Toggle - Only show if not creating for specific client */}
          {!clientId && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="share-toggle">Share with all clients</Label>
                <p className="text-xs text-muted-foreground">
                  All clients in this organization will see this task
                </p>
              </div>
              <Switch
                id="share-toggle"
                checked={shareWithAllClients}
                onCheckedChange={setShareWithAllClients}
              />
            </div>
          )}

          {clientId && (
            <div className="p-3 bg-info/10 border border-info/20 rounded-lg text-sm">
              <p>This task will be assigned to a specific client</p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// UPDATED AddFileModal with Sharing Options
// ============================================
export function AddFileModal({ 
  clientId, 
  organizationId, 
  onClose, 
  onSuccess 
}: {
  clientId?: string;
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [shareWithAllClients, setShareWithAllClients] = useState(!clientId);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setSelectedFile(files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to upload files");

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${organizationId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("client-uploads")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("client_files").insert({
        // Set client_id to null if sharing with all clients
        client_id: shareWithAllClients ? null : clientId,
        organization_id: organizationId,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        storage_path: filePath,
        uploaded_by: user.id,
        is_shared_with_all_clients: shareWithAllClients,
      });

      if (dbError) throw dbError;

      toast.success(
        shareWithAllClients 
          ? "File uploaded and shared with all clients" 
          : "File uploaded for specific client"
      );
      
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File *</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileSelect}
              disabled={isSubmitting}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Sharing Toggle */}
          {!clientId && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="share-file-toggle">Share with all clients</Label>
                <p className="text-xs text-muted-foreground">
                  All clients can access this file
                </p>
              </div>
              <Switch
                id="share-file-toggle"
                checked={shareWithAllClients}
                onCheckedChange={setShareWithAllClients}
              />
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedFile}>
              {isSubmitting ? "Uploading..." : "Upload File"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// UPDATED AddContractModal
// ============================================
export function AddContractModal({ 
  clientId, 
  organizationId, 
  onClose, 
  onSuccess 
}: {
  clientId?: string;
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareWithAllClients, setShareWithAllClients] = useState(!clientId);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("contracts").insert({
        client_id: shareWithAllClients ? null : clientId,
        organization_id: organizationId,
        title: formData.title,
        description: formData.description || null,
        status: "pending",
        is_shared_with_all_clients: shareWithAllClients,
      });

      if (error) throw error;

      toast.success(
        shareWithAllClients 
          ? "Contract created and shared with all clients" 
          : "Contract created for specific client"
      );
      
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create contract");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Contract</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          {!clientId && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="share-contract-toggle">Share with all clients</Label>
                <p className="text-xs text-muted-foreground">
                  All clients can view and sign this contract
                </p>
              </div>
              <Switch
                id="share-contract-toggle"
                checked={shareWithAllClients}
                onCheckedChange={setShareWithAllClients}
              />
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Contract"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// UPDATED AddMeetingModal
// ============================================
export function AddMeetingModal({ 
  clientId, 
  organizationId, 
  onClose, 
  onSuccess 
}: {
  clientId?: string;
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareWithAllClients, setShareWithAllClients] = useState(!clientId);
  const [formData, setFormData] = useState({
    title: "",
    scheduled_at: "",
    duration_minutes: 60,
    meeting_link: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("meetings").insert({
        client_id: shareWithAllClients ? null : clientId,
        organization_id: organizationId,
        title: formData.title,
        scheduled_at: formData.scheduled_at,
        duration_minutes: formData.duration_minutes,
        meeting_link: formData.meeting_link || null,
        notes: formData.notes || null,
        status: "scheduled",
        is_shared_with_all_clients: shareWithAllClients,
      });

      if (error) throw error;

      toast.success(
        shareWithAllClients 
          ? "Meeting scheduled and shared with all clients" 
          : "Meeting scheduled for specific client"
      );
      
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_at">Date & Time *</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              min={15}
              step={15}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_link">Meeting Link</Label>
            <Input
              id="meeting_link"
              type="url"
              value={formData.meeting_link}
              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {!clientId && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="share-meeting-toggle">Share with all clients</Label>
                <p className="text-xs text-muted-foreground">
                  All clients can see this meeting
                </p>
              </div>
              <Switch
                id="share-meeting-toggle"
                checked={shareWithAllClients}
                onCheckedChange={setShareWithAllClients}
              />
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Schedule Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// UPDATED AddInvoiceModal
// ============================================
export function AddInvoiceModal({ 
  clientId, 
  organizationId, 
  onClose, 
  onSuccess 
}: {
  clientId?: string;
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareWithAllClients, setShareWithAllClients] = useState(!clientId);
  const [formData, setFormData] = useState({
    invoice_number: `INV-${Date.now()}`,
    amount_cents: 0,
    currency: "USD",
    due_date: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("invoices").insert({
        client_id: shareWithAllClients ? null : clientId,
        organization_id: organizationId,
        invoice_number: formData.invoice_number,
        amount_cents: Math.round(formData.amount_cents * 100), // Convert to cents
        currency: formData.currency,
        due_date: formData.due_date,
        description: formData.description || null,
        status: "pending",
        is_shared_with_all_clients: shareWithAllClients,
      });

      if (error) throw error;

      toast.success(
        shareWithAllClients 
          ? "Invoice created and shared with all clients" 
          : "Invoice created for specific client"
      );
      
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice_number">Invoice Number *</Label>
            <Input
              id="invoice_number"
              value={formData.invoice_number}
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount_cents}
                onChange={(e) => setFormData({ ...formData, amount_cents: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="USD"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date *</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {!clientId && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="share-invoice-toggle">Share with all clients</Label>
                <p className="text-xs text-muted-foreground">
                  All clients can see this invoice
                </p>
              </div>
              <Switch
                id="share-invoice-toggle"
                checked={shareWithAllClients}
                onCheckedChange={setShareWithAllClients}
              />
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
