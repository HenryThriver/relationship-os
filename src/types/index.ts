// Re-export from the new specific type files
export * from './contact';
export * from './artifact';
export * from './timeline';

// Keep existing types that might be used elsewhere or by other parts of the old Contact structure.
// Their usage should be reviewed after the main Contact refactor is complete.

// Define ExperienceItem and EducationItem for global use
export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  isCurrent?: boolean;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  graduationDate?: string | null;
}

// Define GoalItem and VentureItem for global use (as they are part of ProfessionalSnapshot)
export interface GoalItem {
  id: string;
  description: string;
  type: 'personal' | 'professional' | 'relationship';
  status: 'active' | 'achieved' | 'on_hold';
}

export interface VentureItem {
  id: string;
  name: string;
  role: string;
  description?: string | null;
}

// Define FamilyMember for global use
export interface FamilyMember {
  id: string;
  name: string;
  relationship: string; // e.g., 'Partner', 'Son', 'Daughter', 'Parent', 'Sibling'
  birthday?: string | null;
  notes?: string | null;
}

// Removed old ArtifactTypeGlobal, ArtifactGlobal, and Contact definitions as they are now in respective files. 

// Make sure to re-export POGArtifactContentStatus and AskArtifactContentStatus if they were missed

// Older types that might still be in use or need refactoring/removal later
// These were identified earlier and kept for now

// Placeholder for a generic User type (expand as needed)
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  // other user-specific fields
} 