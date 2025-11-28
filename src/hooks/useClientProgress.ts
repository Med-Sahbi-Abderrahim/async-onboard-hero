import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculatePercentage } from "@/lib/progress-display";

interface ProgressData {
  overall: number;
  tasks: {
    completed: number;
    total: number;
    percentage: number;
  };
  forms: {
    completed: number;
    total: number;
    percentage: number;
  };
  files: {
    uploaded: number;
    percentage: number;
  };
  contracts: {
    signed: number;
    total: number;
    percentage: number;
  };
  blockedItems: Array<{
    type: "task" | "form" | "contract";
    title: string;
    id: string;
    dueDate?: string;
  }>;
}

export function useClientProgress(clientId: string, organizationId: string) {
  const [progress, setProgress] = useState<ProgressData>({
    overall: 0,
    tasks: { completed: 0, total: 0, percentage: 0 },
    forms: { completed: 0, total: 0, percentage: 0 },
    files: { uploaded: 0, percentage: 0 },
    contracts: { signed: 0, total: 0, percentage: 0 },
    blockedItems: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      // Fetch tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", clientId)
        .eq("organization_id", organizationId)
        .is("deleted_at", null);

      // Fetch form submissions
      const { data: submissions } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("client_id", clientId)
        .eq("organization_id", organizationId)
        .is("deleted_at", null);

      // Fetch files
      const { data: files } = await supabase
        .from("client_files")
        .select("*")
        .eq("client_id", clientId)
        .eq("organization_id", organizationId)
        .is("deleted_at", null);

      // Fetch contracts
      const { data: contracts } = await supabase
        .from("contracts")
        .select("*")
        .eq("client_id", clientId)
        .eq("organization_id", organizationId)
        .is("deleted_at", null);

      // Calculate task progress
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter((t) => t.status === "completed").length || 0;
      const taskPercentage = calculatePercentage(completedTasks, totalTasks);

      // Calculate form progress
      const totalForms = submissions?.length || 0;
      const completedForms =
        submissions?.filter((s) => s.status === "completed" || s.status === "approved").length || 0;
      const formPercentage = calculatePercentage(completedForms, totalForms);

      // File progress (simple count, no progress bar if 0)
      const fileCount = files?.length || 0;
      const filePercentage = fileCount > 0 ? 100 : 0;

      // Calculate contract progress
      const totalContracts = contracts?.length || 0;
      const signedContracts = contracts?.filter((c) => c.status === "signed").length || 0;
      const contractPercentage = calculatePercentage(signedContracts, totalContracts);

      // Calculate overall progress
      // Only include categories that have items
      const percentages: number[] = [];
      if (totalTasks > 0) percentages.push(taskPercentage);
      if (totalForms > 0) percentages.push(formPercentage);
      if (fileCount > 0) percentages.push(filePercentage);
      if (totalContracts > 0) percentages.push(contractPercentage);

      const overallPercentage =
        percentages.length > 0 ? Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length) : 0;

      // Identify blocked items (pending/incomplete items)
      const blockedItems: ProgressData["blockedItems"] = [];

      // Add pending tasks
      tasks
        ?.filter((t) => t.status === "pending" || t.status === "in_progress")
        .forEach((task) => {
          blockedItems.push({
            type: "task",
            title: task.title,
            id: task.id,
            dueDate: task.due_date,
          });
        });

      // Add pending forms
      submissions
        ?.filter((s) => s.status === "pending" || s.status === "in_progress")
        .forEach((submission: any) => {
          blockedItems.push({
            type: "form",
            title: "Pending form submission",
            id: submission.id,
          });
        });

      // Add unsigned contracts
      contracts
        ?.filter((c) => c.status !== "signed")
        .forEach((contract) => {
          blockedItems.push({
            type: "contract",
            title: contract.title,
            id: contract.id,
          });
        });

      setProgress({
        overall: overallPercentage,
        tasks: {
          completed: completedTasks,
          total: totalTasks,
          percentage: taskPercentage,
        },
        forms: {
          completed: completedForms,
          total: totalForms,
          percentage: formPercentage,
        },
        files: {
          uploaded: fileCount,
          percentage: filePercentage,
        },
        contracts: {
          signed: signedContracts,
          total: totalContracts,
          percentage: contractPercentage,
        },
        blockedItems: blockedItems.slice(0, 10), // Limit to 10 most important
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId && organizationId) {
      fetchProgress();

      // Set up realtime subscriptions for automatic updates
      const tasksChannel = supabase
        .channel(`tasks-${clientId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasks",
            filter: `client_id=eq.${clientId}`,
          },
          () => {
            fetchProgress();
          },
        )
        .subscribe();

      const submissionsChannel = supabase
        .channel(`submissions-${clientId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "form_submissions",
            filter: `client_id=eq.${clientId}`,
          },
          () => {
            fetchProgress();
          },
        )
        .subscribe();

      const filesChannel = supabase
        .channel(`files-${clientId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "client_files",
            filter: `client_id=eq.${clientId}`,
          },
          () => {
            fetchProgress();
          },
        )
        .subscribe();

      const contractsChannel = supabase
        .channel(`contracts-${clientId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "contracts",
            filter: `client_id=eq.${clientId}`,
          },
          () => {
            fetchProgress();
          },
        )
        .subscribe();

      // Cleanup subscriptions
      return () => {
        supabase.removeChannel(tasksChannel);
        supabase.removeChannel(submissionsChannel);
        supabase.removeChannel(filesChannel);
        supabase.removeChannel(contractsChannel);
      };
    }
  }, [clientId, organizationId]);

  return { progress, loading, refresh: fetchProgress };
}
