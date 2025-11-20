import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Submission } from "@/hooks/useSubmissions";

interface SubmissionDetailsProps {
  submission: Submission | null;
  open: boolean;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-pending",
  in_progress: "bg-in-progress",
  completed: "bg-completed",
  approved: "bg-primary",
  rejected: "bg-blocked",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  approved: "Approved",
  rejected: "Rejected",
};

export function SubmissionDetails({ submission, open, onClose }: SubmissionDetailsProps) {
  if (!submission) return null;

  const renderFieldValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Submission Details</SheetTitle>
          <SheetDescription>
            View complete submission information and responses
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Client Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Client Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{submission.client.full_name || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{submission.client.email}</span>
              </div>
              {submission.client.company_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{submission.client.company_name}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Form Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Form Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Form:</span>
                <span className="font-medium">{submission.intake_form.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge className={statusColors[submission.status]}>
                  {statusLabels[submission.status]}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-medium">{submission.completion_percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">
                  {format(new Date(submission.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              {submission.submitted_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="font-medium">
                    {format(new Date(submission.submitted_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Responses */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Form Responses</h3>
            {Object.keys(submission.responses).length === 0 ? (
              <p className="text-sm text-muted-foreground">No responses yet.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(submission.responses).map(([fieldId, value]) => (
                  <div key={fieldId} className="space-y-1">
                    <label className="text-sm font-medium capitalize">
                      {fieldId.replace(/_/g, " ")}
                    </label>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {renderFieldValue(value)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
