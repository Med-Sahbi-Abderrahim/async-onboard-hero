import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock, FileText, Upload, FileSignature, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatProgressDescription } from "@/lib/progress-display.tsx";

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
  icon: React.ComponentType<{ className?: string }>;
  date?: string;
}

interface MilestoneTimelineProps {
  clientId: string;
  organizationId: string;
  progress: {
    tasks: { completed: number; total: number; percentage: number };
    forms: { completed: number; total: number; percentage: number };
    files: { uploaded: number; percentage: number };
    contracts: { signed: number; total: number; percentage: number };
  };
}

export function MilestoneTimeline({ progress }: MilestoneTimelineProps) {
  // Build milestones based on progress data
  const milestones: Milestone[] = [
    {
      id: "tasks",
      title: "Complete Tasks",
      description: formatProgressDescription(progress.tasks.completed, progress.tasks.total, "tasks"),

      status:
        progress.tasks.percentage === 100 ? "completed" : progress.tasks.percentage > 0 ? "in-progress" : "pending",
      icon: ListChecks,
    },
    {
      id: "forms",
      title: "Submit Forms",
      description: formatProgressDescription(progress.forms.completed, progress.forms.total, "tasks"),

      status:
        progress.forms.percentage === 100 ? "completed" : progress.forms.percentage > 0 ? "in-progress" : "pending",
      icon: FileText,
    },
    {
      id: "files",
      title: "Upload Files",
      description: formatProgressDescription(progress.files.completed, progress.files.total, "tasks"),

      status:
        progress.files.percentage === 100 ? "completed" : progress.files.percentage > 0 ? "in-progress" : "pending",
      icon: Upload,
    },
    {
      id: "contracts",
      title: "Sign Contracts",
      description: formatProgressDescription(progress.contracts.completed, progress.contracts.total, "tasks"),

      status:
        progress.contracts.percentage === 100
          ? "completed"
          : progress.contracts.percentage > 0
            ? "in-progress"
            : "pending",
      icon: FileSignature,
    },
  ];

  const getStatusIcon = (status: Milestone["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-completed" />;
      case "in-progress":
        return <Circle className="h-6 w-6 text-in-progress fill-in-progress/20" />;
      case "pending":
        return <Clock className="h-6 w-6 text-pending" />;
    }
  };

  const getStatusColor = (status: Milestone["status"]) => {
    switch (status) {
      case "completed":
        return "border-completed bg-completed/5";
      case "in-progress":
        return "border-in-progress bg-in-progress/5";
      case "pending":
        return "border-pending/50 bg-pending/5";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding Milestones</CardTitle>
        <CardDescription>Track key steps in the client onboarding process</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border" />

          <div className="space-y-6">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon;
              return (
                <div key={milestone.id} className="relative flex gap-4">
                  {/* Status indicator */}
                  <div className="relative z-10 flex-shrink-0">{getStatusIcon(milestone.status)}</div>

                  {/* Milestone content */}
                  <div
                    className={cn(
                      "flex-1 rounded-lg border-2 p-4 transition-all animate-fade-in",
                      getStatusColor(milestone.status),
                      milestone.status === "completed" && "shadow-soft",
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-semibold">{milestone.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                      </div>
                      {milestone.status === "completed" && (
                        <div className="text-xs font-medium text-completed bg-completed/10 px-2 py-1 rounded">
                          Complete
                        </div>
                      )}
                      {milestone.status === "in-progress" && (
                        <div className="text-xs font-medium text-in-progress bg-in-progress/10 px-2 py-1 rounded animate-pulse">
                          In Progress
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
