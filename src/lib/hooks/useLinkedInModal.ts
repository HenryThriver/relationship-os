'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LinkedInImportApiResponse } from '@/types/rapidapi'; // To type the API response

interface UseLinkedInModalReturn {
  rescrapeProfile: (contactId: string, linkedinUrl: string) => Promise<LinkedInImportApiResponse>;
  isLoading: boolean;
  error: string | null;
  // success: boolean; // Or handle success via Promise resolution
}

export const useLinkedInModal = (): UseLinkedInModalReturn => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [success, setSuccess] = useState(false);

  const rescrapeProfile = useCallback(async (contactId: string, linkedinUrl: string): Promise<LinkedInImportApiResponse> => {
    setIsLoading(true);
    setError(null);
    // setSuccess(false);

    try {
      const response = await fetch('/api/linkedin/rescrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactId, linkedinUrl }),
      });

      const result: LinkedInImportApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to rescrape LinkedIn profile.');
      }
      
      // Invalidate relevant queries upon successful rescrape
      // This will cause components using these queries to re-fetch data
      await queryClient.invalidateQueries({ queryKey: ['artifactTimeline', contactId] });
      await queryClient.invalidateQueries({ queryKey: ['contactDetail', contactId] }); // If you have a query for contact details
      await queryClient.invalidateQueries({ queryKey: ['artifacts', contactId] }); // Generic artifacts list for contact
      // Potentially invalidate the specific artifact detail if it's cached and you want to ensure it shows the *old* one until timeline reloads
      // Or, if the modal is meant to show the *new* artifact, that's a different logic flow.
      // For now, focusing on refreshing lists that would show the new artifact.

      // setSuccess(true);
      return result; // Return the full API response for flexibility

    } catch (err: unknown) {
      console.error('Error rescraping LinkedIn profile:', err);
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred during rescrape.');
      } else {
        setError('An unexpected error occurred during rescrape.');
      }
      // setSuccess(false);
      throw err; // Re-throw the error so the caller can also handle it if needed
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  return {
    rescrapeProfile,
    isLoading,
    error,
    // success,
  };
}; 