import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
  isClient?: boolean;
}

export function TaskCard({ task, onUpdate, isClient = false }: TaskCardProps) {
  const getStatusIcon = () => {
    switch (task.status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      in_progress: "default",
      completed: "secondary",
      cancelled: "destructive",
    };

    return (
      <Badge variant={variants[task.status] || "outline"}>
        {task.status.replace("_", " ")}
      </Badge>
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else if (task.completed_at) {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", task.id);

      if (error) throw error;

      toast.success("Task updated");
      onUpdate();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getStatusIcon()}</div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium">{task.title}</h3>
              {getStatusBadge()}
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Due {format(new Date(task.due_date), "MMM d, yyyy")}</span>
                </div>
              )}
              {task.completed_at && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Completed {format(new Date(task.completed_at), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              {task.status !== "completed" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("completed")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              )}
              {task.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("in_progress")}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Start
                </Button>
              )}
              {task.status === "completed" && !isClient && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("pending")}
                >
                  Reopen
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}