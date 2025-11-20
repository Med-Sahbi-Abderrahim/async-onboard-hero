import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormFieldBuilder, FormField } from "@/components/forms/FormFieldBuilder";
import { FormBrandingSection } from "@/components/forms/FormBrandingSection";
import { FormSettingsSection } from "@/components/forms/FormSettingsSection";
import { FormPreview } from "@/components/forms/FormPreview";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useOrgId } from "@/hooks/useOrgId";

export default function EditForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const orgId = useOrgId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [branding, setBranding] = useState<{
    logo_url?: string;
    primary_color: string;
    font_family?: string;
  }>({
    logo_url: "",
    primary_color: "#007bff",
    font_family: "Inter",
  });
  const [settings, setSettings] = useState<{
    send_reminders: boolean;
    redirect_url?: string;
    is_public: boolean;
  }>({
    send_reminders: false,
    redirect_url: "",
    is_public: true,
  });

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

      // Populate form with existing data
      setTitle(data.title);
      setDescription(data.description || "");
      setFields((data.fields as unknown as FormField[]) || []);
      setBranding((data.custom_branding as unknown as typeof branding) || branding);
      setSettings((data.settings as unknown as typeof settings) || settings);
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

  const handleSaveForm = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a form title.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("intake_forms")
        .update({
          title,
          description: description || null,
          fields: fields as any,
          custom_branding: branding as any,
          settings: {
            ...settings,
            success_message: "Thank you for your submission!",
            submit_button_text: "Submit",
          } as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Form updated",
        description: "Your changes have been saved successfully.",
      });
      navigate(orgId ? `/forms/${orgId}/${id}` : `/forms/${id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(orgId ? `/forms/${orgId}/${id}` : `/forms/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Form</h1>
            <p className="text-muted-foreground mt-1">
              Make changes to your intake form
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
          <Button onClick={handleSaveForm} disabled={saving || !title.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Form Builder */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Form Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Client Intake Form"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this form is for..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FormFieldBuilder fields={fields} onChange={setFields} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FormBrandingSection branding={branding} onChange={setBranding} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FormSettingsSection settings={settings} onChange={setSettings} />
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Preview */}
        {showPreview && (
          <div className="lg:sticky lg:top-6 h-fit">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <FormPreview
                    title={title}
                    description={description}
                    fields={fields}
                    logoUrl={branding.logo_url}
                    primaryColor={branding.primary_color}
                    fontFamily={branding.font_family}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
