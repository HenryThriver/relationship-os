import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  IconButton,
  CircularProgress // Added for loading state
} from '@mui/material';
import {
  Close as CloseIcon,
  AutoAwesome as AIIcon,
  TrendingUp as LoopIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { LoopType, LoopStatus, LoopAction } from '@/types/artifact'; // Added LoopStatus, LoopAction for initial action
import { useToast } from '@/lib/contexts/ToastContext';
import { TablesInsert } from '@/lib/supabase/types_db';

interface LoopSuggestionFromDB {
  id: string;
  contact_id: string;
  source_artifact_id: string;
  status: string;
  created_loop_id: string | null;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
  suggestion_data: {
    type: LoopType;
    title: string;
    description: string;
    current_status: LoopStatus;
    reciprocity_direction: 'giving' | 'receiving';
    confidence: number;
    reasoning: string;
  };
}

interface LoopSuggestionsProps {
  contactId: string;
}

export const LoopSuggestions: React.FC<LoopSuggestionsProps> = ({ contactId }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: suggestions = [], isLoading } = useQuery<LoopSuggestionFromDB[], Error>({
    queryKey: ['loop-suggestions', contactId],
    queryFn: async (): Promise<LoopSuggestionFromDB[]> => {
      const { data, error } = await supabase
        .from('loop_suggestions')
        .select('*')
        .eq('contact_id', contactId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter and type-cast the data to ensure proper structure
      return (data || [])
        .filter(item => item.suggestion_data && typeof item.suggestion_data === 'object')
        .map(item => ({
          ...item,
          suggestion_data: item.suggestion_data as LoopSuggestionFromDB['suggestion_data']
        }));
    }
  });

  const acceptSuggestionMutation = useMutation<
    any, // Return type of created loop artifact (can be more specific)
    Error,
    string // suggestionId
  >({
    mutationFn: async (suggestionId: string) => {
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (!suggestion) throw new Error('Suggestion not found');

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not authenticated for accepting suggestion.");

      const initialAction: LoopAction = {
        id: crypto.randomUUID(),
        status: suggestion.suggestion_data.current_status, // Use the suggested status
        action_type: 'check_in', // Default action type for AI suggestion creation
        created_at: new Date().toISOString(),
        notes: `Created from AI suggestion: ${suggestion.suggestion_data.reasoning}`
      };

      const artifactToInsert: TablesInsert<'artifacts'> = {
        contact_id: contactId,
        user_id: user.id,
        type: 'loop' as any, // Known type issue
        content: JSON.stringify({
          title: suggestion.suggestion_data.title,
          description: suggestion.suggestion_data.description,
          type: suggestion.suggestion_data.type,
          status: suggestion.suggestion_data.current_status,
          reciprocity_direction: suggestion.suggestion_data.reciprocity_direction,
          initiator: 'user', // Or determine based on suggestion if possible
          actions: [initialAction]
        }),
        timestamp: new Date().toISOString(),
      };

      const { data: loop, error: loopError } = await supabase
        .from('artifacts')
        .insert(artifactToInsert as any) // Known type issue
        .select()
        .single();

      if (loopError) throw loopError;
      if (!loop) throw new Error('Failed to create loop from suggestion.');

      const { error: updateError } = await supabase
        .from('loop_suggestions')
        .update({ 
          status: 'accepted',
          created_loop_id: loop.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (updateError) {
        // If updating suggestion fails, we might want to roll back loop creation or log inconsistency
        console.error('Failed to update suggestion status after loop creation:', updateError);
        throw updateError; // Propagate to onError
      }
      return loop;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loop-suggestions', contactId] });
      queryClient.invalidateQueries({ queryKey: ['loops', contactId] });
      showToast('Loop created from suggestion!', 'success');
    },
    onError: (error) => {
      showToast(`Error creating loop from suggestion: ${error.message}`, 'error');
      console.error('Accept suggestion error:', error);
    }
  });

  const rejectSuggestionMutation = useMutation<
    any,
    Error,
    string // suggestionId
  >({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('loop_suggestions')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loop-suggestions', contactId] });
      showToast('Suggestion dismissed', 'info');
    },
    onError: (error) => {
      showToast(`Error dismissing suggestion: ${error.message}`, 'error');
      console.error('Reject suggestion error:', error);
    }
  });

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.lighten(0.9)', textAlign: 'center' }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{mt:1}}>Loading AI Loop Suggestions...</Typography>
      </Paper>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't render anything if no pending suggestions
  }

  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.lighten(0.9)' }}> {/* Updated bgcolor for visibility */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <AIIcon color="primary" />
        <Typography variant="h6" color="primary.main">
          AI Suggested Loops
        </Typography>
      </Box>

      {suggestions.map((suggestion) => (
        <Card key={suggestion.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Typography variant="subtitle1" component="div">
                {suggestion.suggestion_data.title}
              </Typography>
              <Box display="flex" gap={1} alignItems="center">
                <Chip 
                  size="small" 
                  label={`${Math.round(suggestion.suggestion_data.confidence * 100)}% confident`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={suggestion.suggestion_data.reciprocity_direction.replace(/\b\w/g, l => l.toUpperCase())}
                  color={suggestion.suggestion_data.reciprocity_direction === 'giving' ? 'success' : 'info'}
                />
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {suggestion.suggestion_data.description}
            </Typography>

            <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
              AI Reasoning: {suggestion.suggestion_data.reasoning}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Suggested Status: {suggestion.suggestion_data.current_status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Typography>
          </CardContent>

          <CardActions sx={{justifyContent: 'space-between'}}>
            <Button
              size="small"
              variant="contained"
              startIcon={<LoopIcon />}
              onClick={() => acceptSuggestionMutation.mutate(suggestion.id)}
              disabled={acceptSuggestionMutation.isPending || rejectSuggestionMutation.isPending}
            >
              {acceptSuggestionMutation.isPending && acceptSuggestionMutation.variables === suggestion.id 
                ? 'Creating...' 
                : 'Create Loop'}
            </Button>
            <Button
              size="small"
              startIcon={<CloseIcon />}
              onClick={() => rejectSuggestionMutation.mutate(suggestion.id)}
              disabled={acceptSuggestionMutation.isPending || rejectSuggestionMutation.isPending}
              color="inherit"
            >
              {rejectSuggestionMutation.isPending && rejectSuggestionMutation.variables === suggestion.id
                ? 'Dismissing...'
                : 'Dismiss'}
            </Button>
          </CardActions>
        </Card>
      ))}
    </Paper>
  );
}; 