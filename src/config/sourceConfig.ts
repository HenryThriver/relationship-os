import React from 'react';
import MicIcon from '@mui/icons-material/Mic';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import NoteIcon from '@mui/icons-material/Note';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export interface SourceTypeConfig {
  icon: React.ElementType;
  color: string;
  label: string;
  routePattern: string; 
  targetPageBehavior?: 'openModal' | 'scrollToSection' | 'viewArtifactDetail' | 'navigateToUrl';
  // metaFieldForModal?: string; // Example: state variable name on target page to set for modal
  // sectionId?: string; // Example: HTML ID of section to scroll to
}

export const SOURCE_CONFIG: Record<string, SourceTypeConfig> = {
  voice_memo: {
    icon: MicIcon,
    color: '#2196f3',
    label: 'Voice Memo',
    // Contact page will look for artifactView & artifactType to open the VoiceMemoDetailModal
    routePattern: '/dashboard/contacts/[contactId]?artifactView=[artifactId]&artifactType=voice_memo',
    targetPageBehavior: 'openModal', 
  },
  linkedin_profile: { 
    icon: LinkedInIcon,
    color: '#0077b5',
    label: 'LinkedIn Snapshot',
    // This could link to a generic artifact viewer or a special section/modal on contact page
    routePattern: '/dashboard/contacts/[contactId]?artifactView=[artifactId]&artifactType=linkedin_profile',
    targetPageBehavior: 'viewArtifactDetail', // Placeholder: assumes a generic detail view or a specific modal trigger on contact page
  },
  email: {
    icon: EmailIcon,
    color: '#ea4335',
    label: 'Email',
    routePattern: '/dashboard/artifacts/[artifactId]?type=email', 
    targetPageBehavior: 'viewArtifactDetail',
  },
  meeting: {
    icon: EventIcon,
    color: '#4caf50',
    label: 'Meeting Notes',
    routePattern: '/dashboard/artifacts/[artifactId]?type=meeting',
    targetPageBehavior: 'viewArtifactDetail',
  },
  note: {
    icon: NoteIcon,
    color: '#ff9800',
    label: 'Manual Note',
    routePattern: '/dashboard/artifacts/[artifactId]?type=note',
    targetPageBehavior: 'viewArtifactDetail',
  },
  // Add other specific types like 'manual_entry', 'system_generated', etc. if needed
  default: {
    icon: InfoOutlinedIcon,
    color: '#9e9e9e',
    label: 'Source',
    routePattern: '/dashboard/artifacts/[artifactId]',
    targetPageBehavior: 'viewArtifactDetail',
  }
}; 