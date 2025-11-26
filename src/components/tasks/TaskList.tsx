import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare } from "lucide-react";
import { AddTaskModal } from "./AddTaskModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  client_id: string | null; // Can be null for org-wide tasks
}

interface TaskListProps {
  clientId?: string; // Optional - for client-specific view
  organizationId: string;
  isClient?: boolean;
}

export function TaskList({ clientId, organizationId, isClient = false }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      // For clients: fetch tasks assigned to them OR org-wide tasks (client_id IS NULL)
      if (isClient && clientId) {
        query = query.or(`client_id.eq.${clientId},client_id.is.null`);
      }
      // For org members: fetch all tasks (no additional filter needed)

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [clientId, organizationId]);

  const filterTasks = (status: string) => {
    if (status === "all") return tasks;
    return tasks.filter((task) => task.status === status);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <TaskSkeleton />
        <TaskSkeleton />
        <TaskSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tasks</h2>
        {!isClient && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filterTasks("pending").length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({filterTasks("in_progress").length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filterTasks("completed").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks yet"
              description={
                isClient
                  ? "You have no assigned tasks at the moment. Check back later for updates."
                  : "Create your first task to start tracking work and deadlines."
              }
              action={
                !isClient
                  ? {
                      label: "Create First Task",
                      onClick: () => setShowAddModal(true),
                    }
                  : undefined
              }
            />
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} onUpdate={fetchTasks} isClient={isClient} />)
          )}
        </TabsContent>

        {["pending", "in_progress", "completed"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-3 mt-4">
            {filterTasks(status).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground animate-fade-in">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="font-medium">No {status.replace("_", " ")} tasks</p>
                <p className="text-sm mt-1">Tasks will appear here as they're created</p>
              </div>
            ) : (
              filterTasks(status).map((task) => (
                <TaskCard key={task.id} task={task} onUpdate={fetchTasks} isClient={isClient} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {showAddModal && (
        <AddTaskModal
          clientId={clientId}
          organizationId={organizationId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
}
