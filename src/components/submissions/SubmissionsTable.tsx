import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Inbox } from "lucide-react";
import { format } from "date-fns";
import { Submission } from "@/hooks/useSubmissions";
import { TableSkeleton } from "@/components/ui/loading-skeleton";

interface SubmissionsTableProps {
  submissions: Submission[];
  loading: boolean;
  onViewDetails: (submission: Submission) => void;
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

export function SubmissionsTable({ submissions, loading, onViewDetails }: SubmissionsTableProps) {
  if (loading) {
    return <TableSkeleton rows={8} />;
  }

  if (submissions.length === 0) {
    return null; // Parent handles empty state
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Form</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((submission) => (
          <TableRow key={submission.id}>
            <TableCell>
              <div>
                <div className="font-medium">{submission.client.full_name || "Unknown"}</div>
                <div className="text-sm text-muted-foreground">{submission.client.email}</div>
                {submission.client.company_name && (
                  <div className="text-xs text-muted-foreground">{submission.client.company_name}</div>
                )}
              </div>
            </TableCell>
            <TableCell>{submission.intake_form.title}</TableCell>
            <TableCell>
              <Badge className={statusColors[submission.status]}>
                {statusLabels[submission.status]}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${submission.completion_percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">{submission.completion_percentage}%</span>
              </div>
            </TableCell>
            <TableCell>
              {submission.submitted_at
                ? format(new Date(submission.submitted_at), "MMM d, yyyy")
                : "-"}
            </TableCell>
            <TableCell>{format(new Date(submission.created_at), "MMM d, yyyy")}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(submission)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
