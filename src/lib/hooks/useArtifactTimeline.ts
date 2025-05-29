'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { BaseArtifact, ArtifactType, GroupedArtifact, TimelineStatsData } from '@/types';
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns';
import { ALL_ARTIFACT_TYPES } from '@/config/artifactConfig';

interface UseArtifactTimelineOptions {
  filterTypes?: ArtifactType[];
  // Add other options like date range, sort order etc. later
}

// Helper to group artifacts by date and format them
const groupAndFormatArtifacts = (artifacts: BaseArtifact[]): GroupedArtifact[] => {
  if (!artifacts || artifacts.length === 0) return [];

  const grouped = artifacts.reduce((acc, artifact) => {
    const date = format(parseISO(artifact.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(artifact);
    return acc;
  }, {} as Record<string, BaseArtifact[]>);

  return Object.entries(grouped)
    .map(([date, arts]) => ({
      date,
      dateLabel: format(parseISO(date), 'MMMM d, yyyy'), // More readable date label
      artifacts: arts.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()), // Sort artifacts within a day by time (desc)
    }))
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()); // Sort groups by date (desc)
};

// Helper to calculate timeline stats
const calculateTimelineStats = (artifacts: BaseArtifact[]): TimelineStatsData => {
  if (!artifacts || artifacts.length === 0) {
    return {
      totalArtifacts: 0,
      firstArtifactDate: null,
      lastArtifactDate: null,
      artifactTypeCounts: ALL_ARTIFACT_TYPES.reduce((acc, type) => {
        acc[type] = 0;
        return acc;
      }, {} as Record<ArtifactType, number>),
      averageTimeBetweenDays: 0,
    };
  }

  const sortedArtifacts = [...artifacts].sort((a,b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  const firstArtifactDate = format(parseISO(sortedArtifacts[0].timestamp), 'MMM d, yyyy');
  const lastArtifactDate = format(parseISO(sortedArtifacts[sortedArtifacts.length - 1].timestamp), 'MMM d, yyyy');
  
  // Initialize with all artifact types set to 0
  const artifactTypeCounts = ALL_ARTIFACT_TYPES.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as Record<ArtifactType, number>);

  // Count actual artifacts
  artifacts.forEach(artifact => {
    if (artifactTypeCounts.hasOwnProperty(artifact.type)) {
      artifactTypeCounts[artifact.type]++;
    }
  });

  let totalDaysDifference = 0;
  let interactionPairs = 0;
  if (sortedArtifacts.length > 1) {
    const uniqueDays = [...new Set(sortedArtifacts.map(a => startOfDay(parseISO(a.timestamp)).getTime()))]
      .sort((a,b) => a - b);
    
    if (uniqueDays.length > 1) {
        for (let i = 1; i < uniqueDays.length; i++) {
            totalDaysDifference += differenceInDays(uniqueDays[i], uniqueDays[i-1]);
            interactionPairs++;
        }
    }
  }
  const averageTimeBetweenDays = interactionPairs > 0 ? totalDaysDifference / interactionPairs : 0;

  return {
    totalArtifacts: artifacts.length,
    firstArtifactDate,
    lastArtifactDate,
    artifactTypeCounts,
    averageTimeBetweenDays,
  };
};


export const useArtifactTimeline = (contactId: string, options?: UseArtifactTimelineOptions) => {
  const queryKey: [string, string, string] = ['artifactTimeline', contactId, options?.filterTypes?.sort().join('-') || 'allTypes'];

  const queryFn = async (): Promise<BaseArtifact[]> => {
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .eq('contact_id', contactId)
      .order('timestamp', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as BaseArtifact[]) || [];
  };

  return useQuery<
    BaseArtifact[], // TQueryFnData: Data type returned by queryFn
    Error,            // TError
    {                 // TData: Data type after transformation by select
      allArtifacts: BaseArtifact[];
      filteredArtifacts: BaseArtifact[];
      groupedArtifacts: GroupedArtifact[]; 
      stats: TimelineStatsData 
    },
    [string, string, string] // TQueryKey
  >({
    queryKey: queryKey,
    queryFn: queryFn,
    select: (data: BaseArtifact[]) => {
      const allArtifacts = data;
      let filteredArtifacts = allArtifacts;
      if (options?.filterTypes && options.filterTypes.length > 0) {
        filteredArtifacts = allArtifacts.filter((artifact: BaseArtifact) => 
          options.filterTypes!.includes(artifact.type)
        );
      }
      const groupedArtifacts = groupAndFormatArtifacts(filteredArtifacts);
      const stats = calculateTimelineStats(filteredArtifacts);
      return {
        allArtifacts,
        filteredArtifacts,
        groupedArtifacts,
        stats,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 