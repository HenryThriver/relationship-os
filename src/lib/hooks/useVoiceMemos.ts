'use client';

import { useEffect, useMemo, useCallback } from 'react';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Remove this
import { supabase } from '@/lib/supabase/client'; // Import the shared client
import { useQuery, useQueryClient } from '@tanstack/react-query';
// import { Database } from '@/lib/supabase/types_db'; // Unused import
import { VoiceMemoArtifact, ArtifactGlobal } from '@/types/artifact';

// const supabase = createClientComponentClient<Database>(); // Remove this line, use imported supabase

// Helper to assert and type artifact as VoiceMemoArtifact
// This guard helps ensure that the object not only has type 'voice_memo' 
// but also the essential fields expected for a VoiceMemoArtifact after fetching.
function isVoiceMemoArtifact(artifact: unknown): artifact is VoiceMemoArtifact {
  if (
    artifact &&
    typeof artifact === 'object' &&
    artifact !== null &&
    'type' in artifact &&
    (artifact as { type?: unknown }).type === 'voice_memo' &&
    'audio_file_path' in artifact &&
    typeof (artifact as { audio_file_path?: unknown }).audio_file_path === 'string' &&
    'transcription_status' in artifact &&
    typeof (artifact as { transcription_status?: unknown }).transcription_status === 'string'
  ) {
    return true;
  }
  return false;
}

async function fetchVoiceMemos(contactId: string): Promise<VoiceMemoArtifact[]> {
  const { data, error } = await supabase
    .from('artifacts')
    .select('*') // Selects all columns, now typed by regenerated types_db.ts
    .eq('contact_id', contactId)
    .eq('type', 'voice_memo') // Should now be valid with regenerated types
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching voice memos:', error);
    throw new Error(error.message);
  }
  // Filter and type cast. The `as VoiceMemoArtifact[]` cast is more confident now
  // due to regenerated types and the type guard.
  return (data || []).filter(isVoiceMemoArtifact) as VoiceMemoArtifact[];
}

interface UseVoiceMemosOptions {
  contact_id: string | null | undefined;
  initialData?: VoiceMemoArtifact[];
}

export interface ProcessingStatus {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  startedAt?: string | null; // Changed from string to string | null to match VoiceMemoArtifact
  completedAt?: string | null; // Changed from string to string | null
  duration?: number; // in milliseconds
}

export interface UseVoiceMemosReturn {
  voiceMemos: VoiceMemoArtifact[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  processingCount: number;
  getProcessingStatus: (memoId: string) => ProcessingStatus;
  getProcessingDuration: (memoId: string) => number; // returns milliseconds
}

export const useVoiceMemos = ({ contact_id, initialData }: UseVoiceMemosOptions): UseVoiceMemosReturn => {
  const queryClient = useQueryClient();
  // QueryKey must be a list of serializable values
  const queryKey = useMemo(() => ['voice-memos', contact_id], [contact_id]); 

  const { data: voiceMemos = [], isLoading, isError, error } = useQuery<VoiceMemoArtifact[], Error>({
    queryKey: queryKey,
    queryFn: () => {
      if (!contact_id) return Promise.resolve([]);
      return fetchVoiceMemos(contact_id);
    },
    enabled: !!contact_id,
    initialData,
    refetchOnWindowFocus: false, // Optional: configure as needed
  });

  useEffect(() => {
    if (!contact_id) return;

    const channel = supabase
      .channel(`voice_memos_contact_${contact_id}`)
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'artifacts',
          filter: `contact_id=eq.${contact_id}`,
        },
        (payload: Record<string, unknown>) => {
          console.log('Realtime voice memo event:', payload);
          const newArtifact = payload.new as ArtifactGlobal | undefined;
          const oldArtifact = payload.old as ArtifactGlobal | undefined;
          const eventType = payload.eventType as string;

          // Check if the change is relevant to voice memos before invalidating
          let isRelevantChange = false;
          if (eventType === 'INSERT' && newArtifact?.type === 'voice_memo') {
            isRelevantChange = true;
          }
          if (eventType === 'UPDATE' && newArtifact?.type === 'voice_memo') {
            isRelevantChange = true;
          }
          if (eventType === 'DELETE' && oldArtifact?.type === 'voice_memo') {
            isRelevantChange = true;
          }

          if (isRelevantChange) {
            queryClient.invalidateQueries({ queryKey: queryKey });
          }
        }
      )
      .subscribe((status: string, err: unknown) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to voice memo updates for contact:', contact_id);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Supabase channel error:', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contact_id, queryClient, queryKey]);

  const processingCount = useMemo(() => {
    return voiceMemos.filter(memo => 
      memo.transcription_status === 'processing' || 
      (memo.transcription_status === 'completed' && memo.ai_parsing_status === 'processing') || 
      (memo.transcription_status === 'completed' && memo.ai_parsing_status === 'pending' && memo.ai_processing_started_at && !memo.ai_processing_completed_at)
    ).length;
  }, [voiceMemos]);

  const getProcessingStatus = useCallback((memoId: string): ProcessingStatus => {
    const memo = voiceMemos.find(m => m.id === memoId);
    if (!memo) return { status: 'idle' }; // Should not happen if called for existing memo

    // Case 1: Transcription is processing or failed
    if (memo.transcription_status === 'processing') {
      return { status: 'processing', startedAt: memo.created_at }; // Use created_at as a rough start for transcription
    }
    if (memo.transcription_status === 'failed') {
      return { status: 'failed' };
    }

    // Case 2: Transcription completed, now check AI parsing status
    if (memo.transcription_status === 'completed') {
      if (memo.ai_parsing_status === 'processing' || (memo.ai_parsing_status === 'pending' && memo.ai_processing_started_at && !memo.ai_processing_completed_at)) {
        return { status: 'processing', startedAt: memo.ai_processing_started_at };
      }
      if (memo.ai_parsing_status === 'completed') {
        return { 
          status: 'completed', 
          startedAt: memo.ai_processing_started_at, 
          completedAt: memo.ai_processing_completed_at 
        };
      }
      if (memo.ai_parsing_status === 'failed') {
        return { status: 'failed', startedAt: memo.ai_processing_started_at, completedAt: memo.ai_processing_completed_at };
      }
    }
    
    // Default idle state (e.g. transcription complete, AI parsing not yet started or is pending without start time)
    return { status: 'idle' };

  }, [voiceMemos]);

  const getProcessingDuration = useCallback((memoId: string): number => {
    const status = getProcessingStatus(memoId);
    if (status.status === 'processing' && status.startedAt) {
      return Date.now() - new Date(status.startedAt).getTime();
    }
    if ((status.status === 'completed' || status.status === 'failed') && status.startedAt && status.completedAt) {
      return new Date(status.completedAt).getTime() - new Date(status.startedAt).getTime();
    }
    return 0;
  }, [getProcessingStatus]);

  return { voiceMemos, isLoading, isError, error, processingCount, getProcessingStatus, getProcessingDuration };
}; 