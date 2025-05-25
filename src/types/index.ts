export interface Contact {
  id: string; // UUID
  created_at: string; // Timestampz
  name: string | null;
  email: string | null;
  linkedin_url: string;
} 