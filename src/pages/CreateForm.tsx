import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormTemplate } from "@/data/templates/formTemplates";
import { TemplateSelector } from "@/components/forms/TemplateSelector";
import { FormCustomizer } from "@/components/forms/FormCustomizer";
import { FormPreview } from "@/components/forms/FormPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export default function CreateForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [saving, setSaving] = useState(false);

  const handleTemplateSelect = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.name + " Form");
    setDescription("");
    setLogoUrl(template.branding.logo_url || "");
    setPrimaryColor(template.branding.primaryColor);
  };

  const handleSaveForm = async () => {
    if (!selectedTemplate || !user) {
      toast({
        title: "Error",
        description: "Please select a template and ensure you're logged in.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Get user's organization
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!orgMember) {
        throw new Error("No organization found");
      }

      const customBranding = {
        ...selectedTemplate.branding,
        primaryColor,
        logo_url: logoUrl || undefined,
      };

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const { error } = await supabase.from("intake_forms").insert([{
        organization_id: orgMember.organization_id,
        created_by: user.id,
        title,
        description: description || null,
        slug,
        fields: selectedTemplate.fields as any,
        custom_branding: customBranding as any,
        settings: {
          success_message: "Thank you for your submission!",
          submit_button_text: "Submit",
          show_progress_bar: true,
          require_login: false,
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
              Choose a template and customize your intake form
            </p>
          </div>
        </div>
        {selectedTemplate && (
          <Button onClick={handleSaveForm} disabled={saving || !title}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Form"}
          </Button>
        )}
      </div>

      {!selectedTemplate ? (
        <Card>
          <CardHeader>
            <CardTitle>Choose a Template</CardTitle>
            <CardDescription>
              Select a template to get started with your form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleTemplateSelect}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customize Your Form</CardTitle>
              <CardDescription>
                Update the form details and branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="template">Change Template</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="mt-4">
                  <FormCustomizer
                    template={selectedTemplate}
                    title={title}
                    description={description}
                    logoUrl={logoUrl}
                    primaryColor={primaryColor}
                    onTitleChange={setTitle}
                    onDescriptionChange={setDescription}
                    onLogoChange={setLogoUrl}
                    onColorChange={setPrimaryColor}
                  />
                </TabsContent>
                <TabsContent value="template" className="mt-4">
                  <TemplateSelector
                    selectedTemplate={selectedTemplate}
                    onSelectTemplate={handleTemplateSelect}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your form will look to clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormPreview
                template={selectedTemplate}
                title={title}
                description={description}
                logoUrl={logoUrl}
                primaryColor={primaryColor}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
