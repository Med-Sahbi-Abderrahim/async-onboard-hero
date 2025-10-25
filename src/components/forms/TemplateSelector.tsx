import { formTemplates, FormTemplate } from "@/data/templates/formTemplates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface TemplateSelectorProps {
  selectedTemplate: FormTemplate | null;
  onSelectTemplate: (template: FormTemplate) => void;
}

export function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {formTemplates.map((template) => {
        const isSelected = selectedTemplate?.id === template.id;
        return (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onSelectTemplate(template)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <div
                  className="w-8 h-8 rounded-full border-2 border-border"
                  style={{ backgroundColor: template.branding.primaryColor }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {template.fields.length} fields
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 bg-secondary rounded">
                    {template.theme}
                  </span>
                  <span className="text-xs px-2 py-1 bg-secondary rounded">
                    {template.branding.buttonStyle}
                  </span>
                  <span className="text-xs px-2 py-1 bg-secondary rounded">
                    {template.branding.font}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
