import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface FormPreviewProps {
  title: string;
  description?: string;
  fields: FormField[];
  logoUrl?: string;
  primaryColor: string;
  fontFamily?: string;
}

export function FormPreview({
  title,
  description,
  fields,
  logoUrl,
  primaryColor,
  fontFamily = "Inter",
}: FormPreviewProps) {

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
    <div 
      className="bg-background border rounded-lg p-8 space-y-6"
      style={{ fontFamily }}
    >
      {logoUrl && (
        <div className="flex justify-center">
          <img src={logoUrl} alt="Form logo" className="h-16 object-contain" />
        </div>
      )}
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{title || "Untitled Form"}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No fields added yet. Add fields to see them here.
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map(renderField)}
        </div>
      )}

      <Button
        className="w-full"
        style={{ backgroundColor: primaryColor }}
        disabled
      >
        Submit Form
      </Button>
    </div>
  );
}
