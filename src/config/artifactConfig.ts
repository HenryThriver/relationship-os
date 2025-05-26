import type { ArtifactTimelineConfig } from '@/types/timeline';
import type { ArtifactType } from '@/types/artifact'; // The main ArtifactType
import {
  FiFileText, FiMic, FiUsers, FiMail, FiLink, FiClipboard, FiTarget, FiRefreshCw 
} from 'react-icons/fi';

// Helper to truncate text for previews
const truncateText = (text: string, maxLength = 100): string => {
  if (typeof text !== 'string') return 'Invalid content';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

// Define configurations for each artifact type
// This will be expanded and refined
const ARTIFACT_CONFIG: Record<ArtifactType | 'default', ArtifactTimelineConfig> = {
  note: {
    icon: FiFileText,
    color: 'primary.main',
    badgeLabel: 'Note',
    getPreview: (content) => truncateText(content?.text || content?.details || 'Note content'),
  },
  voice_memo: {
    icon: FiMic,
    color: 'secondary.main',
    badgeLabel: 'Voice Memo',
    getPreview: (content) => content?.transcription 
                        ? truncateText(content.transcription, 80)
                        : `Duration: ${content?.duration_seconds || 'N/A'}s`,
  },
  meeting: {
    icon: FiUsers,
    color: 'success.main',
    badgeLabel: 'Meeting',
    getPreview: (content) => truncateText(content?.summary || content?.title || 'Meeting details'),
  },
  email: {
    icon: FiMail,
    color: 'info.main',
    badgeLabel: 'Email',
    getPreview: (content) => truncateText(content?.subject || 'Email content'),
  },
  // Tentative types based on ExtendedArtifactType, assuming ArtifactType will include them
  linkedin_interaction: {
    icon: FiLink,
    color: '#0077B5', // LinkedIn Blue
    badgeLabel: 'LinkedIn',
    getPreview: (content) => truncateText(content?.message || content?.interaction_type || 'LinkedIn interaction'),
  },
  prompt_set: {
    icon: FiClipboard,
    color: 'warning.dark',
    badgeLabel: 'Prompt Set',
    getPreview: (content) => `Contains ${content?.prompts?.length || 0} prompts`,
  },
  goal: {
    icon: FiTarget,
    color: 'error.main',
    badgeLabel: 'Goal',
    getPreview: (content) => truncateText(content?.description || 'Goal details'),
  },
  loop: {
    icon: FiRefreshCw,
    color: '#6A0DAD', // Purple for loops
    badgeLabel: 'Loop',
    getPreview: (content) => `Status: ${content?.status || 'N/A'}. Owner: ${content?.owner || 'N/A'}`,
  },
  // Fallback for any unknown artifact types
  default: {
    icon: FiFileText, // Default icon
    color: 'grey.500',
    badgeLabel: 'Artifact',
    getPreview: (content) => typeof content === 'string' ? truncateText(content) : 'No preview available',
  },
};

export const getArtifactConfig = (type: ArtifactType | string | undefined): ArtifactTimelineConfig => {
  if (type && ARTIFACT_CONFIG[type as ArtifactType]) {
    return ARTIFACT_CONFIG[type as ArtifactType];
  }
  // If type includes a dot (e.g., from field_sources), try splitting and using the first part
  if (type && type.includes('.')){
      const baseType = type.split('.')[0] as ArtifactType;
      if (ARTIFACT_CONFIG[baseType]){
          return ARTIFACT_CONFIG[baseType];
      }
  }
  return ARTIFACT_CONFIG.default;
};

// Export all artifact types for use in filters, etc.
// This should ideally come directly from the ArtifactType definition itself
// or be generated from the keys of ARTIFACT_CONFIG (excluding 'default')
export const ALL_ARTIFACT_TYPES = Object.keys(ARTIFACT_CONFIG).filter(k => k !== 'default') as ArtifactType[];

// You might also want to export the ARTIFACT_CONFIG directly if needed elsewhere
// export { ARTIFACT_CONFIG }; 