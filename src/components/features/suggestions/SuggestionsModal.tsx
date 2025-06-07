'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { UpdateSuggestionRecord } from '@/types/suggestions';
import { SuggestionCard } from './SuggestionCard';
import { BulkActionsToolbar } from './BulkActionsToolbar';

interface SuggestionsModalProps {
  open: boolean;
  onClose: () => void;
  contactId: string;
  contactName?: string;
  suggestions: UpdateSuggestionRecord[];
  onApplySuggestions: (suggestionIds: string[], selectedPathsMap: Record<string, string[]>) => Promise<void>;
  onRejectSuggestions: (suggestionIds: string[]) => Promise<void>;
  onMarkAsViewed: (suggestionId: string) => Promise<void>;
  isLoading?: boolean;
}

export const SuggestionsModal: React.FC<SuggestionsModalProps> = ({
  open,
  onClose,
  contactId,
  contactName,
  suggestions,
  onApplySuggestions,
  onRejectSuggestions,
  onMarkAsViewed,
  isLoading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedSuggestions, setSelectedSuggestions] = useState<Map<string, Set<string>>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset selections when suggestions change
  useEffect(() => {
    const newSelections = new Map<string, Set<string>>();
    suggestions.forEach(record => {
      // Auto-select high confidence suggestions (>= 80%)
      const autoSelected = new Set(
        record.suggested_updates.suggestions
          .filter(s => s.confidence >= 0.8)
          .map(s => s.field_path)
      );
      newSelections.set(record.id, autoSelected);
    });
    setSelectedSuggestions(newSelections);
  }, [suggestions]);

  // Mark suggestions as viewed when modal opens
  useEffect(() => {
    if (open && suggestions.length > 0) {
      suggestions.forEach(record => {
        if (!record.viewed_at) {
          onMarkAsViewed(record.id);
        }
      });
    }
  }, [open, suggestions, onMarkAsViewed]);

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
        onClose(); // Close modal after successful application
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
        onClose(); // Close modal after successful rejection
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

  const highConfidenceSuggestions = suggestions.reduce((sum, record) => 
    sum + record.suggested_updates.suggestions.filter(s => s.confidence >= 0.8).length, 0
  );

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          minHeight: isMobile ? '100vh' : '70vh',
          maxHeight: isMobile ? '100vh' : '90vh',
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600, color: 'primary.main' }}>
              AI Suggestions for {contactName || 'Contact'}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
              <Chip 
                label={`${totalSuggestions} total`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
              {highConfidenceSuggestions > 0 && (
                <Chip 
                  label={`${highConfidenceSuggestions} high confidence`} 
                  size="small" 
                  color="success" 
                  variant="outlined" 
                />
              )}
              {totalSelected > 0 && (
                <Chip 
                  label={`${totalSelected} selected`} 
                  size="small" 
                  color="warning" 
                  variant="filled" 
                />
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="large">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress />
          </Box>
        ) : suggestions.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
            <LightbulbIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No suggestions available
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              AI suggestions will appear here when artifacts are processed.
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Bulk Actions Toolbar */}
            <Box sx={{ p: 2, backgroundColor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
              <BulkActionsToolbar
                totalCount={totalSuggestions}
                selectedCount={totalSelected}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
                onApplySelected={handleApplySelected}
                onRejectSelected={handleRejectSelected}
                isLoading={isProcessing}
              />
            </Box>

            {/* Suggestions List */}
            <Box sx={{ p: 2, maxHeight: '60vh', overflow: 'auto' }}>
              <Box display="flex" flexDirection="column" gap={2}>
                {suggestions.map((suggestionRecord) => (
                  <Box key={suggestionRecord.id}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                      From AI Analysis - {new Date(suggestionRecord.created_at).toLocaleDateString()}
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      {suggestionRecord.suggested_updates.suggestions.map((suggestion) => (
                        <SuggestionCard
                          key={`${suggestionRecord.id}-${suggestion.field_path}`}
                          suggestion={suggestion}
                          selected={selectedSuggestions.get(suggestionRecord.id)?.has(suggestion.field_path) || false}
                          onToggleSelect={(selected: boolean) => 
                            handleToggleSelection(suggestionRecord.id, suggestion.field_path, selected)
                          }
                          compact={true}
                          showSource={true}
                          sourceTimestamp={suggestionRecord.created_at}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      {suggestions.length > 0 && (
        <>
          <Divider />
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={onClose} variant="outlined" disabled={isProcessing}>
              Close
            </Button>
            <Button
              onClick={handleRejectSelected}
              color="error"
              variant="outlined"
              disabled={totalSelected === 0 || isProcessing}
              startIcon={isProcessing ? <CircularProgress size={16} /> : <CancelIcon />}
            >
              Reject Selected ({totalSelected})
            </Button>
            <Button
              onClick={handleApplySelected}
              color="primary"
              variant="contained"
              disabled={totalSelected === 0 || isProcessing}
              startIcon={isProcessing ? <CircularProgress size={16} /> : <CheckCircleIcon />}
            >
              Apply Selected ({totalSelected})
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}; 