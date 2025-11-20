import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { ArrowLeft, Edit, ExternalLink, Eye, Copy, Trash2, BarChart3, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useOrgId } from "@/hooks/useOrgId";
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
  const { toast } = useToast();
  const { user } = useUser();
  const orgId = useOrgId();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && id) {
      loadForm();
    }
  }, [user, id]);

  const loadForm = async () => {
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
      navigate(orgId ? `/forms/${orgId}` : "/forms");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishForm = async () => {
    if (!form) return;

    try {
      const { error } = await supabase
        .from("intake_forms")
        .update({ 
          status: "active",
          published_at: new Date().toISOString()
        })
        .eq("id", form.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Form published successfully",
      });

      loadForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnpublishForm = async () => {
    if (!form) return;

    try {
      const { error } = await supabase
        .from("intake_forms")
        .update({ status: "draft" })
        .eq("id", form.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Form unpublished successfully",
      });

      loadForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteForm = async () => {
    if (!form) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("intake_forms")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", form.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `"${form.title}" has been deleted successfully.`,
      });

      navigate("/forms");
    } catch (error: any) {
      console.error('Delete form error:', error);
      toast({
        title: "Failed to delete form",
        description: "You don't have permission to delete this form or an error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!form) return;
    
    const formUrl = `${window.location.origin}/forms/${form.slug}/submit`;
    try {
      await navigator.clipboard.writeText(formUrl);
      toast({
        title: "Success",
        description: "Form link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!form) {
    return null;
  }

  const formUrl = `${window.location.origin}/forms/${form.slug}/submit`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(orgId ? `/forms/${orgId}` : "/forms")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{form.title}</h1>
              {getStatusBadge(form.status)}
            </div>
            {form.description && (
              <p className="text-muted-foreground mt-1">{form.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(orgId ? `/forms/${orgId}/${form.id}/edit` : `/forms/${form.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {form.status === "active" ? (
            <>
              <Button variant="outline" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button onClick={() => window.open(formUrl, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Form
              </Button>
            </>
          ) : (
            <Button onClick={handlePublishForm}>Publish Form</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{form.view_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{form.submission_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {form.view_count > 0
                ? `${((form.submission_count / form.view_count) * 100).toFixed(1)}%`
                : "0%"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {format(new Date(form.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            {form.published_at && (
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="font-medium">
                  {format(new Date(form.published_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Form Fields</p>
              <p className="font-medium">{form.fields?.length || 0} fields</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Form Slug</p>
              <p className="font-medium font-mono text-sm">{form.slug}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.status === "active" && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Unpublish Form</p>
                <p className="text-sm text-muted-foreground">
                  Make this form unavailable for new submissions
                </p>
              </div>
              <Button variant="outline" onClick={handleUnpublishForm}>
                Unpublish
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Form</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this form and all its submissions
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{form.title}" and all its submissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteForm} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
