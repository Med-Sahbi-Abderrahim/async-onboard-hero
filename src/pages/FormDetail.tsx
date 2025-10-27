import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Eye,
  FileText,
  Calendar,
  Users,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FormDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchForm();
    }
  }, [user, id]);

  const fetchForm = async () => {
    try {
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user?.id)
        .single();

      if (!orgMember) throw new Error("No organization found");

      const { data, error } = await supabase
        .from("intake_forms")
        .select("*")
        .eq("id", id)
        .eq("organization_id", orgMember.organization_id)
        .is("deleted_at", null)
        .single();

      if (error) throw error;
      setForm(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/forms");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const formUrl = `${window.location.origin}/forms/${form.slug}/submit`;
    navigator.clipboard.writeText(formUrl);
    toast({
      title: "Copied!",
      description: "Form link copied to clipboard",
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("intake_forms")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Form deleted successfully",
      });
      navigate("/forms");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = form.status === "active" ? "draft" : "active";
      const updates: any = { status: newStatus };
      
      if (newStatus === "active") {
        updates.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("intake_forms")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Form ${newStatus === "active" ? "published" : "unpublished"} successfully`,
      });
      fetchForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!form) return null;

  const formUrl = `${window.location.origin}/forms/${form.slug}/submit`;
  const statusColors = {
    active: "bg-green-500",
    draft: "bg-gray-500",
    archived: "bg-yellow-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/forms")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{form.title}</h1>
            <p className="text-muted-foreground mt-1">
              {form.description || "No description provided"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/forms/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant={form.status === "active" ? "outline" : "default"}
            onClick={handleToggleStatus}
          >
            {form.status === "active" ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Status & Stats Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Form Information</CardTitle>
            <Badge className={statusColors[form.status as keyof typeof statusColors]}>
              {form.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submissions</p>
                <p className="text-2xl font-bold">{form.submission_count}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Views</p>
                <p className="text-2xl font-bold">{form.view_count}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {format(new Date(form.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          {form.published_at && (
            <div className="text-sm text-muted-foreground">
              Published: {format(new Date(form.published_at), "MMM d, yyyy 'at' h:mm a")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form URL Card */}
      {form.status === "active" && (
        <Card>
          <CardHeader>
            <CardTitle>Public Form Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={formUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(formUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Fields Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Form Fields ({form.fields?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!form.fields || form.fields.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No fields configured</p>
          ) : (
            <div className="space-y-2">
              {form.fields.map((field: any, index: number) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{field.label}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {field.type}
                        {field.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{field.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Send Reminders</span>
            <Badge variant={form.settings?.send_reminders ? "default" : "secondary"}>
              {form.settings?.send_reminders ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Public Access</span>
            <Badge variant={form.settings?.is_public ? "default" : "secondary"}>
              {form.settings?.is_public ? "Public" : "Private"}
            </Badge>
          </div>
          {form.settings?.redirect_url && (
            <div>
              <span className="text-sm text-muted-foreground">Redirect URL:</span>
              <p className="text-sm font-mono">{form.settings.redirect_url}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete this form</p>
              <p className="text-sm text-muted-foreground">
                Once deleted, this form and all its submissions will be permanently removed.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Form
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{form.title}" and all associated submissions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Form"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
