import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Eye, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface IntakeForm {
  id: string;
  title: string;
  description: string | null;
  status: string;
  submission_count: number;
  view_count: number;
  created_at: string;
  slug: string;
}

export default function Forms() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchForms();
    }
  }, [user]);

  const fetchForms = async () => {
    if (!user) return;

    try {
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!orgMember) {
        throw new Error("No organization found");
      }

      const { data, error } = await supabase
        .from("intake_forms")
        .select("id, title, description, status, submission_count, view_count, created_at, slug")
        .eq("organization_id", orgMember.organization_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setForms(data || []);
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast({
        title: "Error",
        description: "Failed to load forms.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Forms</h2>
          <p className="text-muted-foreground mt-2">Create and manage your intake forms.</p>
        </div>
        <Button onClick={() => navigate("/forms/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Forms</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading forms...</div>
          ) : forms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No forms yet. Create your first form to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{form.title}</div>
                        {form.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {form.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={form.status === "published" ? "default" : "secondary"}>
                        {form.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{form.submission_count}</TableCell>
                    <TableCell>{form.view_count}</TableCell>
                    <TableCell>{format(new Date(form.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/forms/${form.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/f/${form.slug}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
