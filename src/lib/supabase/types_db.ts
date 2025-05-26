export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          field_sources: Json | null
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
          field_sources?: Json | null
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
          field_sources?: Json | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_decrypted_secret: {
        Args: { secret_name: string }
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
      ],
    },
  },
} as const
