'use client';

import { useEffect } from 'react';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Remove this
import { supabase } from '@/lib/supabase/client'; // Import the shared client
import { useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { Database } from '@/lib/supabase/types_db';
import { VoiceMemoArtifact, ArtifactGlobal } from '@/types/artifact';

// const supabase = createClientComponentClient<Database>(); // Remove this line, use imported supabase

// Helper to assert and type artifact as VoiceMemoArtifact
// This guard helps ensure that the object not only has type 'voice_memo' 
// but also the essential fields expected for a VoiceMemoArtifact after fetching.
function isVoiceMemoArtifact(artifact: any): artifact is VoiceMemoArtifact {
  return (
    artifact &&
    artifact.type === 'voice_memo' &&
    typeof artifact.audio_file_path === 'string' && // Essential field
    typeof artifact.transcription_status === 'string' // Essential field
    // duration_seconds and transcription can be null/undefined initially
  );
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

export const useVoiceMemos = ({ contact_id, initialData }: UseVoiceMemosOptions) => {
  const queryClient = useQueryClient();
  // QueryKey must be a list of serializable values
  const queryKey: QueryKey = ['voiceMemos', contact_id]; 

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
      .on<
        Database['public']['Tables']['artifacts']['Row'] // Explicitly type the payload if possible
      >(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'artifacts',
          filter: `contact_id=eq.${contact_id}`,
        },
        (payload) => {
          console.log('Realtime voice memo event:', payload);
          const newArtifact = payload.new as ArtifactGlobal | undefined;
          const oldArtifact = payload.old as ArtifactGlobal | undefined;

          // Check if the change is relevant to voice memos before invalidating
          let isRelevantChange = false;
          if (payload.eventType === 'INSERT' && newArtifact?.type === 'voice_memo') {
            isRelevantChange = true;
          }
          if (payload.eventType === 'UPDATE' && newArtifact?.type === 'voice_memo') {
            isRelevantChange = true;
          }
          if (payload.eventType === 'DELETE' && oldArtifact?.type === 'voice_memo') {
            isRelevantChange = true;
          }

          if (isRelevantChange) {
            queryClient.invalidateQueries({ queryKey: queryKey });
          }
        }
      )
      .subscribe((status, err) => {
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

  return { voiceMemos, isLoading, isError, error };
}; 