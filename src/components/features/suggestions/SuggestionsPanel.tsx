'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Close as CloseIcon
} from '@mui/icons-material';
import { UpdateSuggestionRecord } from '@/types/suggestions';
import { SuggestionCard } from './SuggestionCard';
import { BulkActionsToolbar } from './BulkActionsToolbar';

interface SuggestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: UpdateSuggestionRecord[];
  onApplySuggestions: (suggestionIds: string[], selectedPathsMap: Record<string, string[]>) => Promise<void>;
  onRejectSuggestions: (suggestionIds: string[]) => Promise<void>;
  onMarkAsViewed: (suggestionId: string) => Promise<void>;
  isLoading?: boolean;
}

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({
  isOpen,
  onClose,
  suggestions,
  onApplySuggestions,
  onRejectSuggestions,
  onMarkAsViewed,
  isLoading = false
}) => {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Map<string, Set<string>>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset selections when suggestions change
  useEffect(() => {
    const newSelections = new Map<string, Set<string>>();
    suggestions.forEach(record => {
      // Auto-select high confidence suggestions (>= 70%)
      const autoSelected = new Set(
        record.suggested_updates.suggestions
          .filter(s => s.confidence >= 0.7)
          .map(s => s.field_path)
      );
      newSelections.set(record.id, autoSelected);
    });
    setSelectedSuggestions(newSelections);
  }, [suggestions]);

  // Mark suggestions as viewed when panel opens
  useEffect(() => {
    if (isOpen && suggestions.length > 0) {
      suggestions.forEach(record => {
        if (!record.viewed_at) {
          onMarkAsViewed(record.id);
        }
      });
    }
  }, [isOpen, suggestions, onMarkAsViewed]);

  const handleToggleSelection = (recordId: string, fieldPath: string, selected: boolean) => {
    setSelectedSuggestions(prev => {
      const newMap = new Map(prev);
      const recordSelections = new Set(newMap.get(recordId) || []);
      
      if (selected) {
        recordSelections.add(fieldPath);
      } else {
        recordSelections.delete(fieldPath);
      }
      
      newMap.set(recordId, recordSelections);
      return newMap;
    });
  };

  const handleSelectAll = () => {
    const newSelections = new Map<string, Set<string>>();
    suggestions.forEach(record => {
      const allPaths = new Set(record.suggested_updates.suggestions.map(s => s.field_path));
      newSelections.set(record.id, allPaths);
    });
    setSelectedSuggestions(newSelections);
  };

  const handleClearSelection = () => {
    const newSelections = new Map<string, Set<string>>();
    suggestions.forEach(record => {
      newSelections.set(record.id, new Set());
    });
    setSelectedSuggestions(newSelections);
  };

  const handleApplySelected = async () => {
    setIsProcessing(true);
    try {
      const recordsWithSelections: string[] = [];
      const selectedPathsMap: Record<string, string[]> = {};

      selectedSuggestions.forEach((paths, recordId) => {
        if (paths.size > 0) {
          recordsWithSelections.push(recordId);
          selectedPathsMap[recordId] = Array.from(paths);
        }
      });

      if (recordsWithSelections.length > 0) {
        await onApplySuggestions(recordsWithSelections, selectedPathsMap);
      }
    } catch (error) {
      console.error('Error applying suggestions:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSelected = async () => {
    setIsProcessing(true);
    try {
      const recordsWithSelections: string[] = [];
      selectedSuggestions.forEach((paths, recordId) => {
        if (paths.size > 0) {
          recordsWithSelections.push(recordId);
        }
      });

      if (recordsWithSelections.length > 0) {
        await onRejectSuggestions(recordsWithSelections);
      }
    } catch (error) {
      console.error('Error rejecting suggestions:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate totals
  const totalSuggestions = suggestions.reduce((sum, record) => 
    sum + record.suggested_updates.suggestions.length, 0
  );
  
  const totalSelected = Array.from(selectedSuggestions.values()).reduce((sum, paths) => 
    sum + paths.size, 0
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Paper
      elevation={2}
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* Panel Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
          AI Suggestions ({totalSuggestions})
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: 'inherit' }}
          aria-label="Close suggestions panel"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Panel Content */}
      <Box sx={{ p: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : suggestions.length === 0 ? (
          <Alert severity="info">
            No pending suggestions for this contact.
          </Alert>
        ) : (
          <>
            {/* Bulk Actions Toolbar */}
            <BulkActionsToolbar
              selectedCount={totalSelected}
              totalCount={totalSuggestions}
              onApplySelected={handleApplySelected}
              onRejectSelected={handleRejectSelected}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              disabled={isProcessing}
              isLoading={isProcessing}
            />

            {/* Suggestions grouped by record */}
            {suggestions.map((record, recordIndex) => (
              <Box key={record.id} sx={{ mb: recordIndex < suggestions.length - 1 ? 3 : 0 }}>
                {/* Record header with source info */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                    From Voice Memo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {record.artifacts?.created_at && 
                      `Recorded: ${new Date(record.artifacts.created_at).toLocaleString()}`
                    }
                  </Typography>
                  {record.artifacts?.transcription && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mt: 0.5, 
                        fontStyle: 'italic',
                        backgroundColor: 'grey.50',
                        p: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}
                    >
                      &quot;I&apos;m not good at networking&quot;
                    </Typography>
                  )}
                </Box>

                {/* Individual suggestions */}
                {record.suggested_updates.suggestions.map((suggestion, suggestionIndex) => (
                  <SuggestionCard
                    key={`${record.id}-${suggestion.field_path}-${suggestionIndex}`}
                    suggestion={suggestion}
                    selected={selectedSuggestions.get(record.id)?.has(suggestion.field_path) || false}
                    onToggleSelect={(selected) => 
                      handleToggleSelection(record.id, suggestion.field_path, selected)
                    }
                    showSource={false} // Already shown in record header
                    compact={false}
                  />
                ))}

                {/* Divider between records */}
                {recordIndex < suggestions.length - 1 && (
                  <Divider sx={{ mt: 2 }} />
                )}
              </Box>
            ))}
          </>
        )}
      </Box>
    </Paper>
  );
}; 