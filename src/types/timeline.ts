import type { BaseArtifact, ArtifactType } from './artifact'; // Assuming artifact types are here
import type { IconType } from 'react-icons'; // Or from MUI if using MUI icons exclusively

// Configuration for how each artifact type should be displayed in the timeline
export interface ArtifactTimelineConfig {
  icon: IconType | React.ElementType; // React component or MUI SvgIconComponent
  color: string; // MUI theme color key (e.g., 'primary.main', 'secondary.light') or hex code
  badgeLabel: string; // Short label for the item header (e.g., "Voice Memo")
  getPreview: (content: unknown) => string | React.ReactNode; // Function to generate a concise preview string or JSX
  // Potentially add: getDetailView: (content: unknown) => React.ReactNode; for modal
}

// Represents a group of artifacts, typically by day
export interface GroupedArtifact {
  date: string; // YYYY-MM-DD format for keying and sorting
  dateLabel: string; // User-friendly date (e.g., "May 26, 2024")
  artifacts: BaseArtifact[];
}

// Data for the statistics display above the timeline
export interface TimelineStatsData {
  totalArtifacts: number;
  firstArtifactDate: string | null; // Formatted string
  lastArtifactDate: string | null; // Formatted string
  artifactTypeCounts: Record<ArtifactType, number>;
  averageTimeBetweenDays: number; // Average number of days between interaction days
}

// If we centralize all artifact type definitions and their specific content interfaces here:
// This is an alternative or extension to what might be in ./artifact.ts
// For now, we primarily need the types used by the timeline hook and components.

// Example of how you might extend BaseArtifact if needed, though BaseArtifact should be comprehensive
// export interface TimelineArtifact extends BaseArtifact {
//   // Additional properties specific to timeline display, if any
// }

// Making sure all anticipated artifact types are covered by ArtifactType
// This should align with or extend the existing ArtifactType in artifact.ts
// We will consolidate this with the main ArtifactType later.

// This is just for reference if we need specific content types for getPreview
// These should ideally come from artifact.ts or a central types definition
// export type NoteContent = Note['content'];
// export type VoiceMemoContent = VoiceMemo['content'];
// export type MeetingContent = Meeting['content'];
// export type EmailContent = Email['content'];
// ... and so on for other artifact types 