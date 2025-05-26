'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  Checkbox,
  FormControlLabel,
  Chip,
  Alert
} from '@mui/material';
import { ContactUpdateSuggestion } from '@/types/suggestions';

interface UpdateSuggestionsModalProps {
  open: boolean;
  onClose: () => void;
  suggestions: ContactUpdateSuggestion[]; // Should be the inner array of suggestions
  suggestionRecordId: string | null; // ID of the parent contact_update_suggestions record
  contactName: string;
  transcriptionText: string; // Renamed from transcription to avoid conflict if any
  onApprove: (suggestionRecordId: string, selectedPaths: string[]) => Promise<void>; 
  onReject: (suggestionRecordId: string) => Promise<void>;
  isLoading?: boolean;
}

export const UpdateSuggestionsModal: React.FC<UpdateSuggestionsModalProps> = ({
  open,
  onClose,
  suggestions,
  suggestionRecordId,
  contactName,
  transcriptionText,
  onApprove,
  onReject,
  isLoading = false
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Reset selected items when suggestions change (e.g. modal opens for a new suggestion record)
  useEffect(() => {
    setSelected(new Set(suggestions.filter(s => s.confidence >= 0.7).map(s => s.field_path)));
  }, [suggestions]);

  const toggleSelection = (fieldPath: string): void => {
    const newSelected = new Set(selected);
    if (newSelected.has(fieldPath)) {
      newSelected.delete(fieldPath);
    } else {
      newSelected.add(fieldPath);
    }
    setSelected(newSelected);
  };

  const getFieldName = (path: string): string => {
    const names: Record<string, string> = {
      'professional_context.goals': 'Professional Goals',
      'professional_context.current_ventures': 'Current Role/Ventures', // Updated name for clarity
      'professional_context.current_role_description': 'Role Description',
      'professional_context.key_responsibilities': 'Key Responsibilities',
      'professional_context.projects_involved': 'Projects Involved',
      'professional_context.skills': 'Skills',
      'professional_context.challenges': 'Challenges',
      'personal_context.interests': 'Personal Interests',
      'personal_context.family_details.partner_name': 'Partner Name',
      'personal_context.family_details.children_names': 'Children Names',
      'personal_context.key_life_events': 'Key Life Events',
      'personal_context.hobbies': 'Hobbies',
      'personal_context.education': 'Education',
      'company': 'Company',
      'title': 'Job Title'
      // Add more mappings as your AI suggests more field_paths
    };
    // Simple title casing for paths not in the map
    return names[path] || path.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || path;
  };

  const handleApprove = (): void => {
    if (suggestionRecordId) {
      onApprove(suggestionRecordId, Array.from(selected));
    }
  };

  const handleReject = (): void => {
    if (suggestionRecordId) {
      onReject(suggestionRecordId);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        AI Found Updates for {contactName}
      </DialogTitle>
      
      <DialogContent dividers>
        {transcriptionText && (
          <Alert severity="info" sx={{ mb: 2 }}>
            From voice memo: "{transcriptionText.substring(0, 150)}{transcriptionText.length > 150 ? '...' : ''}"
          </Alert>
        )}

        <Typography variant="h6" gutterBottom>
          Suggested Updates ({suggestions.length})
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {suggestions.map((suggestion, index) => (
            <Card key={`${suggestion.field_path}-${index}`} variant="outlined" sx={{ p: 2 }}> {/* Added index to key for safety if field_paths aren't unique in a single suggestion batch */}
              <FormControlLabel
                sx={{ alignItems: 'flex-start', width: '100%' }}
                control={
                  <Checkbox
                    checked={selected.has(suggestion.field_path)}
                    onChange={() => toggleSelection(suggestion.field_path)}
                    sx={{ pt: 0.5 }} 
                  />
                }
                label={
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'medium' }}>
                        {getFieldName(suggestion.field_path)}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${Math.round(suggestion.confidence * 100)}%`}
                        color={suggestion.confidence >= 0.8 ? 'success' : suggestion.confidence >= 0.5 ? 'warning' : 'default'}
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>{suggestion.action.charAt(0).toUpperCase() + suggestion.action.slice(1)}:</strong> { /* Capitalize action */}
                      {Array.isArray(suggestion.suggested_value) 
                        ? suggestion.suggested_value.join(', ')
                        : String(suggestion.suggested_value)}
                    </Typography>
                    
                    {suggestion.reasoning && (
                      <Typography variant="caption" color="text.secondary" component="p">
                        Reasoning: {suggestion.reasoning}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </Card>
          ))}
        </Box>

        {selected.size > 0 && (
          <Alert severity="success" sx={{ mt: 2}}>
            {selected.size} update(s) will be applied with source attribution to the artifact.
          </Alert>
        )}
         {suggestions.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            No specific update suggestions were extracted from this voice memo.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleReject} disabled={isLoading || suggestions.length === 0} color="error">
          Reject All Suggestions
        </Button>
        <Button 
          onClick={handleApprove}
          variant="contained"
          disabled={selected.size === 0 || isLoading || suggestions.length === 0}
        >
          Apply {selected.size > 0 ? `${selected.size} Selected` : 'Updates'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 