// Generated types from Supabase CLI
// Run: supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          role: string | null
          relationship_context: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          role?: string | null
          relationship_context?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          role?: string | null
          relationship_context?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      artifacts: {
        Row: {
          id: string
          contact_id: string
          user_id: string
          type: ArtifactType
          content: string
          timestamp: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          user_id: string
          type: ArtifactType
          content: string
          timestamp?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          user_id?: string
          type?: ArtifactType
          content?: string
          timestamp?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_contact_id_fkey"
            columns: ["contact_id"]
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      artifact_type: ArtifactType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Artifact Types Enum
export type ArtifactType = 
  | 'note'
  | 'meeting'
  | 'email'
  | 'social_interaction'
  | 'public_content'
  | 'pog'
  | 'ask'
  | 'celebration'
  | 'follow_up'

// Convenience types for easier usage
export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type ContactUpdate = Database['public']['Tables']['contacts']['Update']

export type Artifact = Database['public']['Tables']['artifacts']['Row']
export type ArtifactInsert = Database['public']['Tables']['artifacts']['Insert']
export type ArtifactUpdate = Database['public']['Tables']['artifacts']['Update']

// Extended types for application use
export interface ContactWithArtifacts extends Contact {
  artifacts: Artifact[]
}

export interface ArtifactWithContact extends Artifact {
  contact: Contact
} 