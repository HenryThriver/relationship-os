'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Contact, FieldSources } from '@/types/contact'; // Assuming FieldSources will be defined here or Contact has field_sources directly
import type { ArtifactGlobal, ArtifactType, EmailArtifactMetadata, MeetingArtifactMetadata, NoteArtifactMetadata, VoiceMemoArtifact, LinkedInArtifactContent } from '@/types/artifact';
import { SOURCE_CONFIG } from '@/config/sourceConfig'; // Import the new config

// Placeholder for SOURCE_TYPES - this will likely live in the component file or a config file
// For now, just defining a minimal version for routing logic
/*
const PRELIMINARY_SOURCE_TYPES_FOR_ROUTING: Record<string, { routePattern: string }> = {
  voice_memo: { routePattern: '/dashboard/contacts/[contactId]?artifact=[artifactId]' },
  linkedin_profile: { routePattern: '/dashboard/contacts/[contactId]?source=linkedin' }, // May not have a specific artifactId if it's a general link to LinkedIn section
  email: { routePattern: '/dashboard/artifacts/[artifactId]' },
  meeting: { routePattern: '/dashboard/artifacts/[artifactId]' },
  note: { routePattern: '/dashboard/artifacts/[artifactId]' },
  default: { routePattern: '/dashboard/artifacts/[artifactId]' }, // Fallback
};
*/

export interface SourceInfo {
  artifactId: string;
  artifactType: ArtifactType;
  timestamp: string;
  excerpt?: string; // Primary content of the artifact or a specific summary
  title?: string;   // E.g., email subject, meeting title, note title, LinkedIn headline, first line of voice memo transcription
}

interface UseSourceAttributionReturn {
  getSourceInfo: (fieldPath: string) => Promise<SourceInfo | null>; // Made async as it fetches artifact details
  navigateToSource: (artifactId: string, artifactType: ArtifactType) => void;
  isLoadingContact: boolean;
  isLoadingArtifact: boolean; // Separate loading state for when an artifact is being fetched by getSourceInfo
}

export const useSourceAttribution = (contactId: string): UseSourceAttributionReturn => {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [fieldSources, setFieldSources] = useState<FieldSources | null>(null);
  const [isLoadingContact, setIsLoadingContact] = useState<boolean>(true);
  const [isLoadingArtifact, setIsLoadingArtifact] = useState<boolean>(false);
  const [fetchedArtifacts, setFetchedArtifacts] = useState<Record<string, ArtifactGlobal>>({});

  useEffect(() => {
    if (!contactId) return;

    const fetchContactData = async () => {
      setIsLoadingContact(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('id, field_sources')
        .eq('id', contactId)
        .single();

      if (error) {
        console.error('Error fetching contact field_sources:', error);
        setContact(null);
        setFieldSources(null);
      } else if (data) {
        setContact(data as Contact);
        // Assuming field_sources is { [key: string]: string } as per user spec
        setFieldSources(data.field_sources as FieldSources || {}); 
      }
      setIsLoadingContact(false);
    };

    fetchContactData();
  }, [contactId]);

  const getSourceInfo = useCallback(async (fieldPath: string): Promise<SourceInfo | null> => {
    if (!fieldSources || isLoadingContact) {
      // console.log('Field sources not yet available or contact is loading.');
      return null;
    }

    const artifactId = fieldSources[fieldPath];
    if (!artifactId) {
      // console.log(`No source artifact ID found for fieldPath: ${fieldPath}`);
      return null;
    }

    // Check cache first
    if (fetchedArtifacts[artifactId]) {
      const cachedArtifact = fetchedArtifacts[artifactId];
      return {
        artifactId: cachedArtifact.id,
        artifactType: cachedArtifact.type as ArtifactType,
        timestamp: cachedArtifact.created_at, // Or timestamp field if different
        excerpt: cachedArtifact.content?.substring(0, 150) + (cachedArtifact.content && cachedArtifact.content.length > 150 ? '...' : ''), // Basic excerpt
        title: extractTitleFromArtifact(cachedArtifact),
      };
    }

    setIsLoadingArtifact(true);
    try {
      const { data: artifactData, error: artifactError } = await supabase
        .from('artifacts')
        .select('*') // Select all for now, can be optimized
        .eq('id', artifactId)
        .single();

      if (artifactError) {
        console.error(`Error fetching artifact ${artifactId}:`, artifactError);
        setIsLoadingArtifact(false);
        return null;
      }

      if (artifactData) {
        const fetchedArtifact = artifactData as ArtifactGlobal;
        setFetchedArtifacts(prev => ({ ...prev, [artifactId]: fetchedArtifact }));
        
        return {
          artifactId: fetchedArtifact.id,
          artifactType: fetchedArtifact.type as ArtifactType,
          timestamp: fetchedArtifact.created_at, // Or specific timestamp field
          excerpt: fetchedArtifact.content?.substring(0, 150) + (fetchedArtifact.content && fetchedArtifact.content.length > 150 ? '...' : ''), // Basic excerpt from content
          title: extractTitleFromArtifact(fetchedArtifact),
        };
      }
      return null;
    } catch (e) {
      console.error('Exception fetching artifact:', e);
      return null;
    } finally {
      setIsLoadingArtifact(false);
    }
  }, [fieldSources, isLoadingContact, fetchedArtifacts]);

  const extractTitleFromArtifact = (artifact: ArtifactGlobal): string | undefined => {
    switch (artifact.type) {
      case 'voice_memo':
        // For voice memos, use the first few words of transcription if available, or a generic title
        const transcription = (artifact as VoiceMemoArtifact).transcription;
        return transcription ? (transcription.split(' ').slice(0, 10).join(' ') + '...') : 'Voice Memo Recording';
      case 'linkedin_profile':
        return (artifact.metadata as LinkedInArtifactContent)?.headline || 'LinkedIn Profile';
      case 'email':
        return (artifact.metadata as EmailArtifactMetadata)?.subject || 'Email';
      case 'meeting':
        return (artifact.metadata as MeetingArtifactMetadata)?.title || 'Meeting Notes';
      case 'note':
        return (artifact.metadata as NoteArtifactMetadata)?.title || artifact.content?.substring(0,50) || 'Note';
      default:
        // Try to get a title from metadata if it exists and has a title prop
        if (artifact.metadata && typeof artifact.metadata === 'object' && 'title' in artifact.metadata) {
          return (artifact.metadata as any).title;
        }
        // Fallback to first few words of content
        return artifact.content ? artifact.content.split(' ').slice(0, 10).join(' ') + '...' : 'Artifact';
    }
  };

  const navigateToSource = useCallback((artifactId: string, artifactType: ArtifactType) => {
    const sourceTypeKey = artifactType as string; 
    // Use SOURCE_CONFIG here
    const config = SOURCE_CONFIG[sourceTypeKey] || SOURCE_CONFIG.default;
    
    if (config && config.routePattern) {
      let route = config.routePattern
        .replace('[contactId]', contactId)
        .replace('[artifactId]', artifactId);
      
      // For linkedin_profile, if it doesn't use artifactId in its route, ensure it's handled
      if (artifactType === 'linkedin_profile' && !config.routePattern.includes('[artifactId]')) {
        // The provided route pattern for linkedin_profile doesn't include [artifactId]
        // It's /dashboard/contacts/[contactId]?source=linkedin
        // So, no specific artifact ID is used in this example route.
        // If we wanted to link to a specific *version* of a linkedin scrape that *is* an artifact,
        // the route and logic here would need adjustment.
      }
      router.push(route);
    } else {
      console.warn(`No route configuration found for artifact type: ${artifactType}`);
      // Fallback navigation if needed
      router.push(`/dashboard/artifacts/${artifactId}`);
    }
  }, [contactId, router]);

  return {
    getSourceInfo,
    navigateToSource,
    isLoadingContact,
    isLoadingArtifact,
  };
}; 