import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ChevronRight,
  Copy,
  Edit,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  Calendar,
  Loader2,
  Check,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Switch } from "@/components/ui/switch";

const editClientSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(1, "Full name is required"),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  tags: z.string().optional(),
});

type EditClientFormData = z.infer<typeof editClientSchema>;

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditClientFormData>({
    resolver: zodResolver(editClientSchema),
  });

  useEffect(() => {
    fetchClientData();
  }, [id, user]);

  const fetchClientData = async () => {
    if (!user || !id) return;

    setLoading(true);
    try {
      // Get user's organization
      const { data: memberData } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!memberData) return;

      // Fetch client
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .eq("organization_id", memberData.organization_id)
        .is("deleted_at", null)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("form_submissions")
        .select(
          `
          *,
          intake_forms:intake_form_id (
            title
          )
        `,
        )
        .eq("client_id", id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);

      // Populate form
      reset({
        email: clientData.email,
        full_name: clientData.full_name,
        company_name: clientData.company_name || "",
        phone: clientData.phone || "",
        tags: clientData.tags?.join(", ") || "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/clients");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update({ status: isActive ? "active" : "archived" })
        .eq("id", id);

      if (error) throw error;

      setClient({ ...client, status: isActive ? "active" : "archived" });
      toast({
        title: "Success",
        description: `Client ${isActive ? "activated" : "archived"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    const magicLink = `${window.location.origin}/intake/${client.access_token}`;
    try {
      await navigator.clipboard.writeText(magicLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Magic link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleGenerateNewLink = async () => {
    try {
      const newToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      const { error } = await supabase
        .from("clients")
        .update({
          access_token: newToken,
          access_token_expires_at: expiresAt.toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setClient({ ...client, access_token: newToken, access_token_expires_at: expiresAt.toISOString() });
      toast({
        title: "Success",
        description: "New magic link generated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onEditSubmit = async (data: EditClientFormData) => {
    setIsSubmitting(true);
    try {
      const tagsArray = data.tags
        ? data.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      const { error } = await supabase
        .from("clients")
        .update({
          email: data.email,
          full_name: data.full_name,
          company_name: data.company_name || null,
          phone: data.phone || null,
          tags: tagsArray,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client updated successfully",
      });

      setIsEditModalOpen(false);
      fetchClientData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `"${client?.full_name || "Client"}" has been deleted successfully.`,
      });

      navigate("/clients");
    } catch (error: any) {
      console.error("Delete client error:", error);
      toast({
        title: "Failed to delete client",
        description: "You don't have permission to delete this client or an error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) return null;

  const magicLink = `${window.location.origin}/intake/${client.access_token}`;

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/clients">Clients</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{client.full_name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold">
                {getInitials(client.full_name || client.email)}
              </div>
              <div>
                <CardTitle className="text-2xl">{client.full_name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={client.status === "active" ? "default" : "secondary"}>{client.status}</Badge>
                  {client.tags?.map((tag: string) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="status-toggle" className="text-sm">
                {client.status === "active" ? "Active" : "Archived"}
              </Label>
              <Switch id="status-toggle" checked={client.status === "active"} onCheckedChange={handleStatusToggle} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{client.email}</span>
            </div>
            {client.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.company_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{client.company_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Created {format(new Date(client.created_at), "MMM dd, yyyy")}</span>
            </div>
          </div>

          {client.last_activity_at && (
            <div className="text-sm text-muted-foreground">
              Last activity: {formatDistanceToNow(new Date(client.last_activity_at), { addSuffix: true })}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={() => setIsEditModalOpen(true)} variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Client
            </Button>
            <Button onClick={handleDelete} variant="outline">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Magic Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Link</Label>
            <div className="flex gap-2">
              <Input value={magicLink} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {client.access_token_expires_at
                ? `Expires ${formatDistanceToNow(new Date(client.access_token_expires_at), { addSuffix: true })}`
                : "Link expires in 90 days"}
            </p>
          </div>

          <Button variant="outline" onClick={handleGenerateNewLink}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate New Link
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No submissions yet</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(`/submissions/${submission.id}`)}
                >
                  <div>
                    <div className="font-medium">{submission.intake_forms?.title || "Untitled Form"}</div>
                    <div className="text-sm text-muted-foreground">
                      Submitted {format(new Date(submission.created_at), "MMM dd, yyyy")}
                    </div>
                  </div>
                  <Badge>{submission.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register("email")} disabled={isSubmitting} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" {...register("full_name")} disabled={isSubmitting} />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input id="company_name" {...register("company_name")} disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...register("phone")} disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" {...register("tags")} disabled={isSubmitting} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
