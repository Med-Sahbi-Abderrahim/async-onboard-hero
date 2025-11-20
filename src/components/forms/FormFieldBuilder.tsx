import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface FormFieldBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select" },
  { value: "date", label: "Date" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File Upload" },
];

interface SortableFieldItemProps {
  field: FormField;
  index: number;
  updateField: (index: number, updates: Partial<FormField>) => void;
  removeField: (index: number) => void;
}

function SortableFieldItem({ field, index, updateField, removeField }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={isDragging ? "shadow-lg" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div
            className="mt-3 cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Field Label</Label>
                <Input
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  placeholder="Enter field label"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Field Type</Label>
                <Select
                  value={field.type}
                  onValueChange={(value) => updateField(index, { type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Placeholder (optional)</Label>
              <Input
                value={field.placeholder || ""}
                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>

            {field.type === "select" && (
              <div className="space-y-2">
                <Label>Options (comma-separated)</Label>
                <Input
                  value={field.options?.join(", ") || ""}
                  onChange={(e) => 
                    updateField(index, { 
                      options: e.target.value.split(",").map(o => o.trim()).filter(Boolean) 
                    })
                  }
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id={`required-${field.id}`}
                checked={field.required}
                onCheckedChange={(checked) => updateField(index, { required: checked })}
              />
              <Label htmlFor={`required-${field.id}`} className="cursor-pointer">
                Required field
              </Label>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeField(index)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FormFieldBuilder({ fields, onChange }: FormFieldBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      required: false,
    };
    onChange([...fields, newField]);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);

      onChange(arrayMove(fields, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Form Fields</h3>
        <Button onClick={addField} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No fields yet. Click "Add Field" to get started.
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {fields.map((field, index) => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  index={index}
                  updateField={updateField}
                  removeField={removeField}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
