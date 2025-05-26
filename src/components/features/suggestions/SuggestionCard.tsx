'use client';

import React from 'react';
import { 
  Card, 
  CardContent, 
  Box, 
  Typography, 
  Checkbox, 
  FormControlLabel,
  Chip,
  Divider
} from '@mui/material';
import { ContactUpdateSuggestion } from '@/types/suggestions';
import { ConfidenceIndicator } from './ConfidenceIndicator';

interface SuggestionCardProps {
  suggestion: ContactUpdateSuggestion;
  onToggleSelect: (selected: boolean) => void;
  selected: boolean;
  showSource?: boolean;
  compact?: boolean;
  sourceTimestamp?: string;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onToggleSelect,
  selected,
  showSource = false,
  compact = false,
  sourceTimestamp
}) => {
  const getFieldName = (path: string): string => {
    const names: Record<string, string> = {
      'professional_context.goals': 'Professional Goals',
      'professional_context.current_ventures': 'Current Role/Ventures',
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
    };
    return names[path] || path.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || path;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'add':
        return 'success';
      case 'update':
        return 'info';
      case 'remove':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  const isConflicting = suggestion.confidence < 0.5;

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: compact ? 1 : 1.5,
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        backgroundColor: selected ? 'action.selected' : 'background.paper',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: 1
        }
      }}
    >
      <CardContent sx={{ p: compact ? 1.5 : 2, '&:last-child': { pb: compact ? 1.5 : 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Checkbox
            checked={selected}
            onChange={(e) => onToggleSelect(e.target.checked)}
            size={compact ? 'small' : 'medium'}
            sx={{ mt: -0.5 }}
          />
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {/* Header with field name and action */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography 
                variant={compact ? "body2" : "subtitle2"} 
                component="span" 
                sx={{ fontWeight: 'medium', flexGrow: 1 }}
              >
                {getFieldName(suggestion.field_path)}
              </Typography>
              <Chip
                label={suggestion.action.charAt(0).toUpperCase() + suggestion.action.slice(1)}
                size="small"
                color={getActionColor(suggestion.action)}
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            </Box>

            {/* Confidence indicator */}
            <Box sx={{ mb: 1.5 }}>
              <ConfidenceIndicator
                confidence={suggestion.confidence}
                reasoning={suggestion.reasoning}
                conflicting={isConflicting}
                size={compact ? 'small' : 'medium'}
              />
            </Box>

            {/* Suggested value */}
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                Suggested Value:
              </Typography>
              <Typography 
                variant={compact ? "caption" : "body2"} 
                sx={{ 
                  mt: 0.5,
                  p: 1,
                  backgroundColor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  fontFamily: 'monospace',
                  fontSize: compact ? '0.75rem' : '0.875rem',
                  wordBreak: 'break-word'
                }}
              >
                {formatValue(suggestion.suggested_value)}
              </Typography>
            </Box>

            {/* Reasoning (collapsed in compact mode) */}
            {!compact && suggestion.reasoning && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                    Reasoning:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    {suggestion.reasoning}
                  </Typography>
                </Box>
              </>
            )}

            {/* Source timestamp */}
            {showSource && sourceTimestamp && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  From voice memo: {new Date(sourceTimestamp).toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}; 