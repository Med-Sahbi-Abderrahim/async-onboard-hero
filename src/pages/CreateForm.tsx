import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, Save, Eye } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export default function CreateForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Form Fields
  const [fields, setFields] = useState<FormField[]>([]);

  // Branding
  const [branding, setBranding] = useState<{
    logo_url?: string;
    primary_color: string;
    font_family?: string;
  }>({
    logo_url: "",
    primary_color: "#007bff",
    font_family: "Inter",
  });

  // Settings
  const [settings, setSettings] = useState<{
    send_reminders: boolean;
    redirect_url?: string;
    is_public: boolean;
  }>({
    send_reminders: false,
    redirect_url: "",
    is_public: true,
  });

  const handleSaveForm = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please ensure you're logged in.",
        variant: "destructive",
      });
      return;
    }

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
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!orgMember) {
        throw new Error("No organization found");
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const { error } = await supabase.from("intake_forms").insert([{
        organization_id: orgMember.organization_id,
        created_by: user.id,
        title,
        description: description || null,
        slug,
        fields: fields as any,
        custom_branding: branding as any,
        settings: {
          ...settings,
          success_message: "Thank you for your submission!",
          submit_button_text: "Submit",
        } as any,
        status: "draft",
      }]);

      if (error) throw error;

      toast({
        title: "Form created",
        description: "Your form has been created successfully.",
      });
      navigate("/forms");
    } catch (error) {
      console.error("Error saving form:", error);
      toast({
        title: "Error",
        description: "Failed to create form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/forms")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Form</h1>
            <p className="text-muted-foreground mt-1">
              Build a custom intake form for your clients
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
            {saving ? "Saving..." : "Save Form"}
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
