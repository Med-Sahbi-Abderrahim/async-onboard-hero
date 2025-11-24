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
            foreignKeyName: "automation_workflows_intake_form_id_fkey"
            columns: ["intake_form_id"]
            isOneToOne: false
            referencedRelation: "intake_forms"
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
        Relationships: []
      }
      client_feedback: {
        Row: {
          client_id: string
          created_at: string
          deleted_at: string | null
          id: string
          message: string
          organization_id: string
          rating: number
        }
        Insert: {
          client_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          message: string
          organization_id: string
          rating: number
        }
        Update: {
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          message?: string
          organization_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_feedback_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_files: {
        Row: {
          client_id: string
          created_at: string
          deleted_at: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          organization_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          deleted_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          organization_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          organization_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
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
          project_status: string | null
          project_title: string | null
          status: Database["public"]["Enums"]["client_status"]
          tags: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
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
          project_status?: string | null
          project_title?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
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
          project_status?: string | null
          project_title?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          client_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          file_path: string | null
          id: string
          organization_id: string
          signed_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          organization_id: string
          signed_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          organization_id?: string
          signed_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      early_access_invites: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          used_count?: number | null
        }
        Relationships: []
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
        Relationships: []
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
        ]
      }
      intake_forms: {
        Row: {
          confirmation_email_enabled: boolean | null
          created_at: string
          created_by: string
          custom_branding: Json
          deleted_at: string | null
          description: string | null
          fields: Json
          id: string
          organization_id: string
          published_at: string | null
          reminder_delay_hours: number | null
          reminder_enabled: boolean | null
          settings: Json
          slug: string
          status: Database["public"]["Enums"]["form_status"]
          submission_count: number
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          confirmation_email_enabled?: boolean | null
          created_at?: string
          created_by: string
          custom_branding?: Json
          deleted_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          organization_id: string
          published_at?: string | null
          reminder_delay_hours?: number | null
          reminder_enabled?: boolean | null
          settings?: Json
          slug: string
          status?: Database["public"]["Enums"]["form_status"]
          submission_count?: number
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          confirmation_email_enabled?: boolean | null
          created_at?: string
          created_by?: string
          custom_branding?: Json
          deleted_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          organization_id?: string
          published_at?: string | null
          reminder_delay_hours?: number | null
          reminder_enabled?: boolean | null
          settings?: Json
          slug?: string
          status?: Database["public"]["Enums"]["form_status"]
          submission_count?: number
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_cents: number
          client_id: string
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          due_date: string
          id: string
          invoice_number: string
          organization_id: string
          paid_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          client_id: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          invoice_number: string
          organization_id: string
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          client_id?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          organization_id?: string
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          client_id: string
          created_at: string
          deleted_at: string | null
          duration_minutes: number | null
          id: string
          meeting_link: string | null
          notes: string | null
          organization_id: string
          scheduled_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          organization_id: string
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          organization_id?: string
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          organization_id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          organization_id: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          organization_id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
      }
      organizations: {
        Row: {
          active_user_count: number | null
          automation_runs_per_user: number | null
          automation_runs_used: number | null
          brand_color: string | null
          branding_level: string | null
          created_at: string | null
          esignature_runs_per_user: number | null
          esignature_runs_used: number | null
          features: Json
          id: string
          is_personal: boolean | null
          lemonsqueezy_customer_id: string | null
          lemonsqueezy_subscription_id: string | null
          logo_url: string | null
          max_portals: number
          max_storage_gb: number
          name: string | null
          plan: string
          price_per_user: number | null
          slug: string | null
          storage_per_user_gb: number | null
          storage_used_bytes: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_renewal_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          support_level: string | null
          trial_ends_at: string | null
        }
        Insert: {
          active_user_count?: number | null
          automation_runs_per_user?: number | null
          automation_runs_used?: number | null
          brand_color?: string | null
          branding_level?: string | null
          created_at?: string | null
          esignature_runs_per_user?: number | null
          esignature_runs_used?: number | null
          features?: Json
          id?: string
          is_personal?: boolean | null
          lemonsqueezy_customer_id?: string | null
          lemonsqueezy_subscription_id?: string | null
          logo_url?: string | null
          max_portals?: number
          max_storage_gb?: number
          name?: string | null
          plan?: string
          price_per_user?: number | null
          slug?: string | null
          storage_per_user_gb?: number | null
          storage_used_bytes?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_renewal_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          support_level?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          active_user_count?: number | null
          automation_runs_per_user?: number | null
          automation_runs_used?: number | null
          brand_color?: string | null
          branding_level?: string | null
          created_at?: string | null
          esignature_runs_per_user?: number | null
          esignature_runs_used?: number | null
          features?: Json
          id?: string
          is_personal?: boolean | null
          lemonsqueezy_customer_id?: string | null
          lemonsqueezy_subscription_id?: string | null
          logo_url?: string | null
          max_portals?: number
          max_storage_gb?: number
          name?: string | null
          plan?: string
          price_per_user?: number | null
          slug?: string | null
          storage_per_user_gb?: number | null
          storage_used_bytes?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_renewal_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          support_level?: string | null
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      reminder_logs: {
        Row: {
          client_id: string
          created_at: string
          email_status: string
          error_message: string | null
          id: string
          metadata: Json | null
          organization_id: string
          reminder_type: string
          retry_count: number
          sent_at: string
          submission_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email_status?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          reminder_type: string
          retry_count?: number
          sent_at?: string
          submission_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email_status?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          reminder_type?: string
          retry_count?: number
          sent_at?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
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
      tasks: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          early_access_end_date: string | null
          email: string | null
          full_name: string | null
          id: string
          last_seen_at: string | null
          organization_id: string | null
          plan: Database["public"]["Enums"]["plan_type"] | null
          preferences: Json | null
          status: Database["public"]["Enums"]["user_status"] | null
          trial_end_date: string | null
          trial_start_date: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          early_access_end_date?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          last_seen_at?: string | null
          organization_id?: string | null
          plan?: Database["public"]["Enums"]["plan_type"] | null
          preferences?: Json | null
          status?: Database["public"]["Enums"]["user_status"] | null
          trial_end_date?: string | null
          trial_start_date?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          early_access_end_date?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          organization_id?: string | null
          plan?: Database["public"]["Enums"]["plan_type"] | null
          preferences?: Json | null
          status?: Database["public"]["Enums"]["user_status"] | null
          trial_end_date?: string | null
          trial_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_monthly_cost: { Args: { org_id: string }; Returns: number }
      calculate_submission_completion: {
        Args: { form_fields: Json; submission_responses: Json }
        Returns: number
      }
      can_create_client: { Args: { org_id: string }; Returns: boolean }
      can_upload_file: {
        Args: { file_size_bytes: number; org_id: string }
        Returns: boolean
      }
      create_notification_for_org: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_organization_id: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      delete_user_and_org: {
        Args: { user_id_to_delete: string }
        Returns: string
      }
      get_early_access_days_remaining: {
        Args: { user_id: string }
        Returns: number
      }
      get_submissions_needing_reminders: {
        Args: never
        Returns: {
          client_email: string
          client_full_name: string
          client_id: string
          form_slug: string
          form_title: string
          hours_since_update: number
          organization_id: string
          reminder_delay_hours: number
          reminder_interval: number
          submission_id: string
        }[]
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
      has_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
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
      use_early_access_invite: { Args: { invite_code: string }; Returns: Json }
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
      plan_type: "free" | "starter" | "pro" | "enterprise"
      submission_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "approved"
        | "rejected"
      user_role: "owner" | "admin" | "member"
      user_status: "early_access" | "free_trial" | "active" | "suspended"
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
      plan_type: ["free", "starter", "pro", "enterprise"],
      submission_status: [
        "pending",
        "in_progress",
        "completed",
        "approved",
        "rejected",
      ],
      user_role: ["owner", "admin", "member"],
      user_status: ["early_access", "free_trial", "active", "suspended"],
    },
  },
} as const
