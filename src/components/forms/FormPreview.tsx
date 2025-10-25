import { FormTemplate, FormField } from "@/data/templates/formTemplates";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface FormPreviewProps {
  template: FormTemplate;
  title: string;
  description: string;
  logoUrl: string;
  primaryColor: string;
}

export function FormPreview({
  template,
  title,
  description,
  logoUrl,
  primaryColor,
}: FormPreviewProps) {
  const buttonStyleClass = {
    rounded: "rounded-md",
    square: "rounded-none",
    pill: "rounded-full",
  }[template.branding.buttonStyle];

  const renderField = (field: FormField) => {
    const fieldLabel = (
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
    );

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              disabled
            />
          </div>
        );
      case "select":
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "checkbox":
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox id={field.id} disabled />
            {fieldLabel}
          </div>
        );
      default:
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              disabled
            />
          </div>
        );
    }
  };

  return (
    <div className="bg-background border rounded-lg p-8 space-y-6">
      {logoUrl && (
        <div className="flex justify-center">
          <img src={logoUrl} alt="Form logo" className="h-16 object-contain" />
        </div>
      )}
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="space-y-4">
        {template.fields.map(renderField)}
      </div>

      <Button
        className={buttonStyleClass}
        style={{ backgroundColor: primaryColor }}
        disabled
      >
        Submit Form
      </Button>
    </div>
  );
}
