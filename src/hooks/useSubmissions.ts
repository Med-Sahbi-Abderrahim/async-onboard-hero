import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Submission {
  id: string;
  organization_id: string;
  intake_form_id: string;
  client_id: string;
  status: "pending" | "in_progress" | "completed" | "approved" | "rejected";
  responses: Record<string, any>;
  completion_percentage: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  client: {
    full_name: string | null;
    email: string;
    company_name: string | null;
  };
  intake_form: {
    title: string;
    slug: string;
  };
}

interface UseSubmissionsOptions {
  searchQuery?: string;
  statusFilter?: string;
  page?: number;
  pageSize?: number;
}

export function useSubmissions(options: UseSubmissionsOptions = {}) {
  const { searchQuery = "", statusFilter = "all", page = 1, pageSize = 20 } = options;
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Get user's organization
  useEffect(() => {
    const fetchOrganization = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setOrganizationId(data.organization_id);
      }
    };

    fetchOrganization();
  }, []);

  // Fetch submissions
  useEffect(() => {
    if (!organizationId) return;

    const fetchSubmissions = async () => {
      setLoading(true);

      let query = supabase
        .from("form_submissions")
        .select(
          `
          id,
          organization_id,
          intake_form_id,
          client_id,
          status,
          responses,
          completion_percentage,
          submitted_at,
          created_at,
          updated_at,
          client:clients (
            full_name,
            email,
            company_name
          ),
          intake_form:intake_forms (
            title,
            slug
          )
        `,
          { count: "exact" }
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      // Apply status filter
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      // Apply search filter
      if (searchQuery) {
        // Note: This is a simple search. For production, consider full-text search
        query = query.or(
          `client.email.ilike.%${searchQuery}%,client.full_name.ilike.%${searchQuery}%,client.company_name.ilike.%${searchQuery}%`
        );
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching submissions:", error);
      } else if (data) {
        setSubmissions(data as any);
        setTotalCount(count || 0);
      }

      setLoading(false);
    };

    fetchSubmissions();
  }, [organizationId, searchQuery, statusFilter, page, pageSize]);

  // Set up real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel("form_submissions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "form_submissions",
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          console.log("Real-time update:", payload);

          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            // Fetch the full record with relations
            const { data } = await supabase
              .from("form_submissions")
              .select(
                `
                id,
                organization_id,
                intake_form_id,
                client_id,
                status,
                responses,
                completion_percentage,
                submitted_at,
                created_at,
                updated_at,
                client:clients (
                  full_name,
                  email,
                  company_name
                ),
                intake_form:intake_forms (
                  title,
                  slug
                )
              `
              )
              .eq("id", payload.new.id)
              .single();

            if (data) {
              setSubmissions((prev) => {
                const index = prev.findIndex((s) => s.id === data.id);
                if (index >= 0) {
                  // Update existing
                  const updated = [...prev];
                  updated[index] = data as any;
                  return updated;
                } else {
                  // Add new to beginning
                  return [data as any, ...prev];
                }
              });
            }
          } else if (payload.eventType === "DELETE") {
            setSubmissions((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  return {
    submissions,
    loading,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}
