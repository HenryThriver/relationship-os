export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      artifacts: {
        Row: {
          ai_parsing_status: string | null
          ai_processing_completed_at: string | null
          ai_processing_started_at: string | null
          audio_file_path: string | null
          contact_id: string
          content: string
          created_at: string
          duration_seconds: number | null
          id: string
          impact_score: number | null
          initiator_contact_id: string | null
          initiator_user_id: string | null
          loop_status: string | null
          metadata: Json | null
          recipient_contact_id: string | null
          recipient_user_id: string | null
          reciprocity_weight: number | null
          timestamp: string
          transcription: string | null
          transcription_status: string | null
          type: Database["public"]["Enums"]["artifact_type_enum"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_parsing_status?: string | null
          ai_processing_completed_at?: string | null
          ai_processing_started_at?: string | null
          audio_file_path?: string | null
          contact_id: string
          content: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          impact_score?: number | null
          initiator_contact_id?: string | null
          initiator_user_id?: string | null
          loop_status?: string | null
          metadata?: Json | null
          recipient_contact_id?: string | null
          recipient_user_id?: string | null
          reciprocity_weight?: number | null
          timestamp?: string
          transcription?: string | null
          transcription_status?: string | null
          type: Database["public"]["Enums"]["artifact_type_enum"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_parsing_status?: string | null
          ai_processing_completed_at?: string | null
          ai_processing_started_at?: string | null
          audio_file_path?: string | null
          contact_id?: string
          content?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          impact_score?: number | null
          initiator_contact_id?: string | null
          initiator_user_id?: string | null
          loop_status?: string | null
          metadata?: Json | null
          recipient_contact_id?: string | null
          recipient_user_id?: string | null
          reciprocity_weight?: number | null
          timestamp?: string
          transcription?: string | null
          transcription_status?: string | null
          type?: Database["public"]["Enums"]["artifact_type_enum"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_initiator_contact_id_fkey"
            columns: ["initiator_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_recipient_contact_id_fkey"
            columns: ["recipient_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_logs: {
        Row: {
          artifacts_created: number | null
          contacts_updated: string[] | null
          errors: Json | null
          events_processed: number | null
          id: string
          metadata: Json | null
          status: string | null
          sync_completed_at: string | null
          sync_started_at: string | null
          user_id: string
        }
        Insert: {
          artifacts_created?: number | null
          contacts_updated?: string[] | null
          errors?: Json | null
          events_processed?: number | null
          id?: string
          metadata?: Json | null
          status?: string | null
          sync_completed_at?: string | null
          sync_started_at?: string | null
          user_id: string
        }
        Update: {
          artifacts_created?: number | null
          contacts_updated?: string[] | null
          errors?: Json | null
          events_processed?: number | null
          id?: string
          metadata?: Json | null
          status?: string | null
          sync_completed_at?: string | null
          sync_started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_emails: {
        Row: {
          contact_id: string
          created_at: string | null
          email: string
          email_type: string | null
          id: string
          is_primary: boolean | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          email: string
          email_type?: string | null
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          email?: string
          email_type?: string | null
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_specific_sync_jobs: {
        Row: {
          contact_id: string
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          status: string | null
          sync_options: Json
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          status?: string | null
          sync_options?: Json
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          status?: string | null
          sync_options?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_specific_sync_jobs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_update_suggestions: {
        Row: {
          applied_at: string | null
          artifact_id: string | null
          confidence_scores: Json | null
          contact_id: string | null
          created_at: string | null
          dismissed_at: string | null
          field_paths: string[]
          id: string
          priority: string | null
          reviewed_at: string | null
          status: string | null
          suggested_updates: Json
          user_id: string | null
          user_selections: Json | null
          viewed_at: string | null
        }
        Insert: {
          applied_at?: string | null
          artifact_id?: string | null
          confidence_scores?: Json | null
          contact_id?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          field_paths: string[]
          id?: string
          priority?: string | null
          reviewed_at?: string | null
          status?: string | null
          suggested_updates: Json
          user_id?: string | null
          user_selections?: Json | null
          viewed_at?: string | null
        }
        Update: {
          applied_at?: string | null
          artifact_id?: string | null
          confidence_scores?: Json | null
          contact_id?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          field_paths?: string[]
          id?: string
          priority?: string | null
          reviewed_at?: string | null
          status?: string | null
          suggested_updates?: Json
          user_id?: string | null
          user_selections?: Json | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_update_suggestions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_update_suggestions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          connection_cadence_days: number | null
          created_at: string
          email: string | null
          email_addresses: string[] | null
          field_sources: Json | null
          gmail_labels: string[] | null
          id: string
          last_interaction_date: string | null
          linkedin_data: Json | null
          linkedin_url: string
          location: string | null
          name: string | null
          notes: string | null
          personal_context: Json | null
          professional_context: Json | null
          relationship_score: number | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          connection_cadence_days?: number | null
          created_at?: string
          email?: string | null
          email_addresses?: string[] | null
          field_sources?: Json | null
          gmail_labels?: string[] | null
          id?: string
          last_interaction_date?: string | null
          linkedin_data?: Json | null
          linkedin_url: string
          location?: string | null
          name?: string | null
          notes?: string | null
          personal_context?: Json | null
          professional_context?: Json | null
          relationship_score?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          connection_cadence_days?: number | null
          created_at?: string
          email?: string | null
          email_addresses?: string[] | null
          field_sources?: Json | null
          gmail_labels?: string[] | null
          id?: string
          last_interaction_date?: string | null
          linkedin_data?: Json | null
          linkedin_url?: string
          location?: string | null
          name?: string | null
          notes?: string | null
          personal_context?: Json | null
          professional_context?: Json | null
          relationship_score?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_sync_jobs: {
        Row: {
          contact_id: string
          created_artifacts: number | null
          created_at: string
          date_range_end: string
          date_range_start: string
          email_addresses: string[]
          error_message: string | null
          id: string
          max_results: number | null
          metadata: Json | null
          processed_at: string | null
          processed_emails: number | null
          status: string | null
          sync_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_artifacts?: number | null
          created_at?: string
          date_range_end: string
          date_range_start: string
          email_addresses: string[]
          error_message?: string | null
          id?: string
          max_results?: number | null
          metadata?: Json | null
          processed_at?: string | null
          processed_emails?: number | null
          status?: string | null
          sync_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_artifacts?: number | null
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          email_addresses?: string[]
          error_message?: string | null
          id?: string
          max_results?: number | null
          metadata?: Json | null
          processed_at?: string | null
          processed_emails?: number | null
          status?: string | null
          sync_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sync_jobs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_sync_state: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_sync_timestamp: string | null
          last_sync_token: string | null
          sync_status: string | null
          total_emails_synced: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_timestamp?: string | null
          last_sync_token?: string | null
          sync_status?: string | null
          total_emails_synced?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_timestamp?: string | null
          last_sync_token?: string | null
          sync_status?: string | null
          total_emails_synced?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loop_analytics: {
        Row: {
          completion_time_days: number | null
          contact_id: string
          created_at: string | null
          id: string
          loop_artifact_id: string
          loop_type: string
          reciprocity_impact: number | null
          status_transitions: Json
          success_score: number | null
          user_id: string
        }
        Insert: {
          completion_time_days?: number | null
          contact_id: string
          created_at?: string | null
          id?: string
          loop_artifact_id: string
          loop_type: string
          reciprocity_impact?: number | null
          status_transitions?: Json
          success_score?: number | null
          user_id: string
        }
        Update: {
          completion_time_days?: number | null
          contact_id?: string
          created_at?: string | null
          id?: string
          loop_artifact_id?: string
          loop_type?: string
          reciprocity_impact?: number | null
          status_transitions?: Json
          success_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_analytics_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_analytics_loop_artifact_id_fkey"
            columns: ["loop_artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_suggestions: {
        Row: {
          contact_id: string
          created_at: string | null
          created_loop_id: string | null
          id: string
          source_artifact_id: string
          status: string
          suggestion_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          created_loop_id?: string | null
          id?: string
          source_artifact_id: string
          status?: string
          suggestion_data: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          created_loop_id?: string | null
          id?: string
          source_artifact_id?: string
          status?: string
          suggestion_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_suggestions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_suggestions_created_loop_id_fkey"
            columns: ["created_loop_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_suggestions_source_artifact_id_fkey"
            columns: ["source_artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_templates: {
        Row: {
          completion_criteria: string[] | null
          created_at: string | null
          default_actions: Json
          default_status: string
          default_title_template: string | null
          description: string | null
          follow_up_schedule: number[] | null
          id: string
          loop_type: string
          name: string
          reciprocity_direction: string
          typical_duration: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completion_criteria?: string[] | null
          created_at?: string | null
          default_actions?: Json
          default_status?: string
          default_title_template?: string | null
          description?: string | null
          follow_up_schedule?: number[] | null
          id?: string
          loop_type: string
          name: string
          reciprocity_direction?: string
          typical_duration?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completion_criteria?: string[] | null
          created_at?: string | null
          default_actions?: Json
          default_status?: string
          default_title_template?: string | null
          description?: string | null
          follow_up_schedule?: number[] | null
          id?: string
          loop_type?: string
          name?: string
          reciprocity_direction?: string
          typical_duration?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      next_connections: {
        Row: {
          agenda: Json | null
          connection_type: string
          contact_id: string | null
          created_at: string | null
          id: string
          location: string | null
          scheduled_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agenda?: Json | null
          connection_type: string
          contact_id?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agenda?: Json | null
          connection_type?: string
          contact_id?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "next_connections_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      trigger_debug_log: {
        Row: {
          artifact_id: string | null
          artifact_type: string | null
          created_at: string | null
          id: number
          message: string | null
          new_status: string | null
          old_status: string | null
          trigger_name: string | null
          trigger_operation: string | null
        }
        Insert: {
          artifact_id?: string | null
          artifact_type?: string | null
          created_at?: string | null
          id?: number
          message?: string | null
          new_status?: string | null
          old_status?: string | null
          trigger_name?: string | null
          trigger_operation?: string | null
        }
        Update: {
          artifact_id?: string | null
          artifact_type?: string | null
          created_at?: string | null
          id?: number
          message?: string | null
          new_status?: string | null
          old_status?: string | null
          trigger_name?: string | null
          trigger_operation?: string | null
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          integration_type: string
          metadata: Json | null
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          integration_type: string
          metadata?: Json | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          integration_type?: string
          metadata?: Json | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          created_at: string
          gmail_access_token: string | null
          gmail_refresh_token: string | null
          gmail_token_expiry: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gmail_access_token?: string | null
          gmail_refresh_token?: string | null
          gmail_token_expiry?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gmail_access_token?: string | null
          gmail_refresh_token?: string | null
          gmail_token_expiry?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_decrypted_secret: {
        Args: { secret_name: string }
        Returns: string
      }
      get_user_integration: {
        Args: { p_user_id: string; p_integration_type: string }
        Returns: {
          id: string
          access_token: string
          refresh_token: string
          token_expires_at: string
          scopes: string[]
          metadata: Json
        }[]
      }
      is_valid_user: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      upsert_user_integration: {
        Args: {
          p_user_id: string
          p_integration_type: string
          p_access_token: string
          p_refresh_token?: string
          p_token_expires_at?: string
          p_scopes?: string[]
          p_metadata?: Json
        }
        Returns: string
      }
    }
    Enums: {
      artifact_type_enum:
        | "note"
        | "email"
        | "call"
        | "meeting"
        | "linkedin_message"
        | "linkedin_post"
        | "file"
        | "other"
        | "linkedin_profile"
        | "pog"
        | "ask"
        | "milestone"
        | "voice_memo"
        | "loop"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      artifact_type_enum: [
        "note",
        "email",
        "call",
        "meeting",
        "linkedin_message",
        "linkedin_post",
        "file",
        "other",
        "linkedin_profile",
        "pog",
        "ask",
        "milestone",
        "voice_memo",
        "loop",
      ],
    },
  },
} as const
