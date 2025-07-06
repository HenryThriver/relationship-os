import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { MeetingArtifact } from '@/types/artifact';

interface UseMeetingsOptions {
  limit?: number;
  includeUpcoming?: boolean;
  contactId?: string;
}

interface UseMeetingsReturn {
  meetings: MeetingArtifact[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useMeetings = (options: UseMeetingsOptions = {}): UseMeetingsReturn => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<MeetingArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchMeetings = useCallback(async (): Promise<void> => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      let query = supabase
        .from('artifacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'meeting')
        .order('timestamp', { ascending: false });

      if (options.contactId) {
        query = query.eq('contact_id', options.contactId);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      let filteredMeetings = data || [];

      // Filter out upcoming meetings if not requested
      if (!options.includeUpcoming) {
        const now = new Date();
        filteredMeetings = filteredMeetings.filter((meeting: Record<string, unknown>) => {
          const metadata = meeting.metadata as Record<string, unknown>;
          const meetingDate = metadata?.meeting_date 
            ? new Date(metadata.meeting_date as string)
            : new Date(meeting.timestamp as string);
          return meetingDate <= now;
        });
      }

      setMeetings(filteredMeetings as unknown as MeetingArtifact[]);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  }, [user, options.contactId, options.limit, options.includeUpcoming]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return {
    meetings,
    loading,
    error,
    refetch: fetchMeetings,
  };
}; 