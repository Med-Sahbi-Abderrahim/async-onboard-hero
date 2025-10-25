export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: Database["public"]["Enums"]["log_action"]
          client_id: string | null
          created_at: string
          description: string
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["log_entity_type"]
          id: string
          ip_address: unknown
          metadata: Json
          organization_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["log_action"]
          client_id?: string | null
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type: Database["public"]["Enums"]["log_entity_type"]
          id?: string
          ip_address?: unknown
          metadata?: Json
          organization_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["log_action"]
          client_id?: string | null
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["log_entity_type"]
          id?: string
          ip_address?: unknown
          metadata?: Json
          organization_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["automation_action_type"]
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          organization_id: string
          output_data: Json | null
          started_at: string
          status: string
          submission_id: string | null
          workflow_id: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["automation_action_type"]
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          organization_id: string
          output_data?: Json | null
          started_at?: string
          status: string
          submission_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["automation_action_type"]
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          organization_id?: string
          output_data?: Json | null
          started_at?: string
          status?: string
          submission_id?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_workflows: {
        Row: {
          actions: Json
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          execution_count: number
          id: string
          intake_form_id: string | null
          is_active: boolean
          max_executions: number | null
          name: string
          organization_id: string
          priority: number
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["automation_trigger_type"]
          updated_at: string
        }
        Insert: {
          actions?: Json
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          execution_count?: number
          id?: string
          intake_form_id?: string | null
          is_active?: boolean
          max_executions?: number | null
          name: string
          organization_id: string
          priority?: number
          trigger_config?: Json
          trigger_type: Database["public"]["Enums"]["automation_trigger_type"]
          updated_at?: string
        }
        Update: {
          actions?: Json
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          execution_count?: number
          id?: string
          intake_form_id?: string | null
          is_active?: boolean
          max_executions?: number | null
          name?: string
          organization_id?: string
          priority?: number
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["automation_trigger_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_workflows_intake_form_id_fkey"
            columns: ["intake_form_id"]
            isOneToOne: false
            referencedRelation: "intake_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_workflows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          amount_cents: number | null
          created_at: string
          currency: string
          event_type: string
          id: string
          metadata: Json
          organization_id: string
          provider: string
          provider_customer_id: string | null
          provider_event_id: string | null
          provider_invoice_id: string | null
          provider_subscription_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          currency?: string
          event_type: string
          id?: string
          metadata?: Json
          organization_id: string
          provider?: string
          provider_customer_id?: string | null
          provider_event_id?: string | null
          provider_invoice_id?: string | null
          provider_subscription_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          currency?: string
          event_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          provider?: string
          provider_customer_id?: string | null
          provider_event_id?: string | null
          provider_invoice_id?: string | null
          provider_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          access_token: string | null
          access_token_expires_at: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string | null
          id: string
          invited_by: string | null
          last_activity_at: string | null
          metadata: Json
          organization_id: string
          phone: string | null
          status: Database["public"]["Enums"]["client_status"]
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          access_token_expires_at?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          last_activity_at?: string | null
          metadata?: Json
          organization_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          access_token_expires_at?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          last_activity_at?: string | null
          metadata?: Json
          organization_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          available_variables: Json
          body_html: string
          body_text: string | null
          category: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          subject: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          available_variables?: Json
          body_html: string
          body_text?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          subject: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          available_variables?: Json
          body_html?: string
          body_text?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          subject?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          client_id: string
          completion_percentage: number
          created_at: string
          deleted_at: string | null
          id: string
          intake_form_id: string
          ip_address: unknown
          organization_id: string
          referrer: string | null
          responses: Json
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          client_id: string
          completion_percentage?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          intake_form_id: string
          ip_address?: unknown
          organization_id: string
          referrer?: string | null
          responses?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          client_id?: string
          completion_percentage?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          intake_form_id?: string
          ip_address?: unknown
          organization_id?: string
          referrer?: string | null
          responses?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_intake_form_id_fkey"
            columns: ["intake_form_id"]
            isOneToOne: false
            referencedRelation: "intake_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_forms: {
        Row: {
          created_at: string
          created_by: string
          custom_branding: Json
          deleted_at: string | null
          description: string | null
          fields: Json
          id: string
          organization_id: string
          published_at: string | null
          settings: Json
          slug: string
          status: Database["public"]["Enums"]["form_status"]
          submission_count: number
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          custom_branding?: Json
          deleted_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          organization_id: string
          published_at?: string | null
          settings?: Json
          slug: string
          status?: Database["public"]["Enums"]["form_status"]
          submission_count?: number
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          custom_branding?: Json
          deleted_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          organization_id?: string
          published_at?: string | null
          settings?: Json
          slug?: string
          status?: Database["public"]["Enums"]["form_status"]
          submission_count?: number
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "intake_forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_forms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invitation_accepted_at: string | null
          invited_by: string | null
          organization_id: string
          permissions: Json
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_accepted_at?: string | null
          invited_by?: string | null
          organization_id: string
          permissions?: Json
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invitation_accepted_at?: string | null
          invited_by?: string | null
          organization_id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_color: string | null
          created_at: string
          custom_domain: string | null
          deleted_at: string | null
          id: string
          is_personal: boolean
          logo_url: string | null
          name: string
          settings: Json
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_started_at: string | null
          subscription_status: Database["public"]["Enums"]["organization_subscription_status"]
          subscription_tier: Database["public"]["Enums"]["organization_subscription_tier"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          custom_domain?: string | null
          deleted_at?: string | null
          id?: string
          is_personal?: boolean
          logo_url?: string | null
          name: string
          settings?: Json
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_started_at?: string | null
          subscription_status?: Database["public"]["Enums"]["organization_subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["organization_subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          custom_domain?: string | null
          deleted_at?: string | null
          id?: string
          is_personal?: boolean
          logo_url?: string | null
          name?: string
          settings?: Json
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_started_at?: string | null
          subscription_status?: Database["public"]["Enums"]["organization_subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["organization_subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      submission_files: {
        Row: {
          created_at: string
          deleted_at: string | null
          field_id: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          is_scanned: boolean
          organization_id: string
          scan_details: Json | null
          scan_result: string | null
          storage_bucket: string
          storage_path: string
          submission_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          field_id: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          is_scanned?: boolean
          organization_id: string
          scan_details?: Json | null
          scan_result?: string | null
          storage_bucket?: string
          storage_path: string
          submission_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          field_id?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          is_scanned?: boolean
          organization_id?: string
          scan_details?: Json | null
          scan_result?: string | null
          storage_bucket?: string
          storage_path?: string
          submission_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_files_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          created_at: string
          id: string
          metric: string
          organization_id: string
          period_end: string
          period_start: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric: string
          organization_id: string
          period_end: string
          period_start: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          metric?: string
          organization_id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string
          id: string
          last_seen_at: string | null
          onboarding_completed: boolean
          preferences: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name: string
          id: string
          last_seen_at?: string | null
          onboarding_completed?: boolean
          preferences?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string
          id?: string
          last_seen_at?: string | null
          onboarding_completed?: boolean
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_submission_completion: {
        Args: { form_fields: Json; submission_responses: Json }
        Returns: number
      }
      get_user_organizations: { Args: { p_user_id: string }; Returns: string[] }
      has_organization_role: {
        Args: {
          p_org_id: string
          p_user_id: string
          required_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      increment_form_view_count: {
        Args: { form_id: string }
        Returns: undefined
      }
      is_organization_member: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      automation_action_type:
        | "send_email"
        | "update_status"
        | "assign_to_user"
        | "create_task"
        | "webhook"
      automation_trigger_type:
        | "submission_created"
        | "status_changed"
        | "reminder_scheduled"
        | "no_response"
        | "field_condition_met"
      client_status: "active" | "archived" | "blocked"
      form_status: "draft" | "active" | "archived"
      log_action:
        | "created"
        | "updated"
        | "deleted"
        | "viewed"
        | "submitted"
        | "approved"
        | "rejected"
        | "invited"
        | "archived"
      log_entity_type:
        | "organization"
        | "user"
        | "client"
        | "form"
        | "submission"
        | "workflow"
        | "template"
      organization_subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "cancelled"
        | "paused"
      organization_subscription_tier: "free" | "pro" | "enterprise"
      submission_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "approved"
        | "rejected"
      user_role: "owner" | "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      automation_action_type: [
        "send_email",
        "update_status",
        "assign_to_user",
        "create_task",
        "webhook",
      ],
      automation_trigger_type: [
        "submission_created",
        "status_changed",
        "reminder_scheduled",
        "no_response",
        "field_condition_met",
      ],
      client_status: ["active", "archived", "blocked"],
      form_status: ["draft", "active", "archived"],
      log_action: [
        "created",
        "updated",
        "deleted",
        "viewed",
        "submitted",
        "approved",
        "rejected",
        "invited",
        "archived",
      ],
      log_entity_type: [
        "organization",
        "user",
        "client",
        "form",
        "submission",
        "workflow",
        "template",
      ],
      organization_subscription_status: [
        "active",
        "trialing",
        "past_due",
        "cancelled",
        "paused",
      ],
      organization_subscription_tier: ["free", "pro", "enterprise"],
      submission_status: [
        "pending",
        "in_progress",
        "completed",
        "approved",
        "rejected",
      ],
      user_role: ["owner", "admin", "member"],
    },
  },
} as const
