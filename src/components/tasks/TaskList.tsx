import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { AddTaskModal } from "./AddTaskModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

interface TaskListProps {
  clientId: string;
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
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", clientId)
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <TabsTrigger value="pending">
            Pending ({filterTasks("pending").length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({filterTasks("in_progress").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filterTasks("completed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No tasks yet</p>
              {!isClient && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Task
                </Button>
              )}
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={fetchTasks}
                isClient={isClient}
              />
            ))
          )}
        </TabsContent>

        {["pending", "in_progress", "completed"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-3 mt-4">
            {filterTasks(status).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No {status.replace("_", " ")} tasks</p>
              </div>
            ) : (
              filterTasks(status).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={fetchTasks}
                  isClient={isClient}
                />
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