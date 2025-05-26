// Re-export from the new specific type files
export * from './contact';
export * from './artifact';

// Keep existing types that might be used elsewhere or by other parts of the old Contact structure.
// Their usage should be reviewed after the main Contact refactor is complete.

// Define ExperienceItem and EducationItem for global use
export interface ExperienceItem {
  title?: string | null;
  company?: string | null;
  duration?: string | null;
}

export interface EducationItem {
  school?: string | null;
  degree?: string | null;
}

// Define GoalItem and VentureItem for global use (as they are part of ProfessionalSnapshot)
export interface GoalItem {
    id: string;
    text: string;
}

export interface VentureItem {
    id: string;
    name: string;
    description?: string;
}

// Define FamilyMember for global use
export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  details?: string | null;
}

// Removed old ArtifactTypeGlobal, ArtifactGlobal, and Contact definitions as they are now in respective files. 