import type { ArtifactTimelineConfig } from '@/types/timeline';
import type { ArtifactType } from '@/types/artifact'; // The main ArtifactType
import {
  FiFileText, FiMic, FiMail, FiLink, FiClipboard, FiTarget, FiVideo
} from 'react-icons/fi';
import { LoopArtifactContent } from '@/types/artifact'; // Added LoopArtifactContent
import { Loop as LoopIcon } from '@mui/icons-material'; // Added for new loop config

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
    icon: FiVideo,
    color: '#1976d2', // Blue for meetings
    badgeLabel: 'Meeting',
    getPreview: (content: any) => {
      // Handle both old and new meeting artifact formats
      // For new format, metadata should be accessible through content
      if (content && typeof content === 'object') {
        const title = content.title || content.summary || 'Meeting';
        const attendeeCount = content.attendees?.length || content.attendee_emails?.length || 0;
        const duration = content.duration_minutes ? ` • ${content.duration_minutes}m` : '';
        const source = content.calendar_source === 'google' ? ' 📅' : '';
        
        return `${title}${attendeeCount > 0 ? ` • ${attendeeCount} attendees` : ''}${duration}${source}`;
      }
      
      // Fallback for legacy format or string content
      return truncateText(typeof content === 'string' ? content : 'Meeting details');
    },
  },
  email: {
    icon: FiMail,
    color: 'info.main',
    badgeLabel: 'Email',
    getPreview: (content: any) => {
      // Handle EmailArtifactContent from metadata
      if (content && typeof content === 'object') {
        const subject = content.subject || '';
        const from = content.from?.name || content.from?.email || '';
        const threadInfo = content.thread_length > 1 ? ` (${content.thread_position}/${content.thread_length})` : '';
        const readStatus = content.is_read === false ? '●' : '';
        const starred = content.is_starred ? '⭐' : '';
        const attachments = content.has_attachments ? '📎' : '';
        
        return `${readStatus}${starred}${attachments} ${from}: ${subject}${threadInfo}`.trim();
      }
      
      // Fallback for legacy format or string content
      return truncateText(typeof content === 'string' ? content : 'Email content');
    },
  },
  linkedin_interaction: {
    icon: FiLink,
    color: '#0077B5', // LinkedIn Blue
    badgeLabel: 'LinkedIn Interaction',
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
    icon: LoopIcon, // Updated Icon
    color: '#9C27B0', // Purple for loops
    badgeLabel: 'Loop',
    getPreview: (contentArg) => { // Changed from artifact: ArtifactGlobal
      const content = contentArg as LoopArtifactContent;
      
      if (!content) return 'Loop artifact';
      
      // Build concise but informative preview
      const title = content.title || 'Untitled Loop';
      // Ensure status is treated as string for key access, and provide default
      const status = content.status ? String(content.status).toLowerCase() : 'idea';
      const direction = content.reciprocity_direction || 'giving';
      
      // Status indicators
      const statusEmoji: Record<string, string> = {
        'idea': '💡',
        'queued': '📋', 
        'offered': '🤝',
        'received': '📨',
        'accepted': '✅',
        'declined': '❌',
        'in_progress': '⚡',
        'pending_approval': '⏳',
        'delivered': '🎯',
        'following_up': '👀',
        'completed': '🎉',
        'abandoned': '🚫'
      };
      const currentStatusEmoji = statusEmoji[status] || '🔄';
      
      // Direction context
      const directionText = direction === 'giving' ? 'Offering' : 'Requesting';
      
      // Build preview: "💡 Offering: Introduction to Sarah (idea)"
      return `${currentStatusEmoji} ${directionText}: ${title} (${status.replace('_', ' ')})`;
    }
  },
  call: {
    icon: FiFileText, // Placeholder icon
    color: 'grey.700',
    badgeLabel: 'Call',
    getPreview: (content) => truncateText(content?.summary || 'Call details'),
  },
  linkedin_message: {
    icon: FiLink,
    color: '#0077B5',
    badgeLabel: 'LinkedIn Message',
    getPreview: (content) => truncateText(content?.message || 'LinkedIn message'),
  },
  linkedin_post: {
    icon: FiLink,
    color: '#0077B5',
    badgeLabel: 'LinkedIn Post',
    getPreview: (content: any) => {
      // Handle LinkedIn post artifact metadata
      if (content && typeof content === 'object') {
        const post = content as any;
        const preview = post.content || post.post_content || 'LinkedIn post';
        const truncated = truncateText(preview, 120);
        
        // Add engagement metrics if available
        if (post.engagement) {
          const likes = post.engagement.likes || 0;
          const comments = post.engagement.comments || 0;
          const engagement = `👍 ${likes} 💬 ${comments}`;
          
          // Add author context if not authored by contact
          const authorContext = post.is_author === false ? ` • by ${post.author}` : '';
          
          return `${truncated}\n${engagement}${authorContext}`;
        }
        
        return truncated;
      }
      
      return truncateText(typeof content === 'string' ? content : 'LinkedIn post');
    },
  },
  file: {
    icon: FiFileText,
    color: 'grey.700',
    badgeLabel: 'File',
    getPreview: (content) => truncateText(content?.filename || 'File details'),
  },
  other: {
    icon: FiFileText,
    color: 'grey.700',
    badgeLabel: 'Other',
    getPreview: (content) => truncateText(content?.description || 'Other artifact'),
  },
  linkedin_profile: {
    icon: FiLink,
    color: '#0077B5',
    badgeLabel: 'LinkedIn Profile',
    getPreview: (content) => truncateText(content?.headline || 'LinkedIn profile data'),
  },
  pog: {
    icon: FiFileText, // Or a specific POG icon
    color: 'info.light',
    badgeLabel: 'POG',
    getPreview: (content) => truncateText(content?.description || 'POG details'),
  },
  ask: {
    icon: FiFileText, // Or a specific Ask icon
    color: 'warning.light',
    badgeLabel: 'Ask',
    getPreview: (content) => truncateText(content?.request_description || 'Ask details'),
  },
  milestone: {
    icon: FiTarget, // Or a specific Milestone icon
    color: 'success.dark',
    badgeLabel: 'Milestone',
    getPreview: (content) => truncateText(content?.description || 'Milestone details'),
  },
  // Fallback for any unknown artifact types (shouldn't be hit if all ArtifactType members are covered)
  default: {
    icon: FiFileText,
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

// More type-safe derivation of ALL_ARTIFACT_TYPES
const allConfigKeys = Object.keys(ARTIFACT_CONFIG);
export const ALL_ARTIFACT_TYPES: ArtifactType[] = allConfigKeys.filter(
  (key): key is ArtifactType => key !== 'default'
);

export default ARTIFACT_CONFIG; 