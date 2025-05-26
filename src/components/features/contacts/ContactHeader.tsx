import React from 'react';
import { Box, Typography, Paper, Avatar, Button, Stack, Chip } from '@mui/material';
import { SuggestionNotificationBadge } from '../suggestions/SuggestionNotificationBadge';
import type { PersonalContext as PersonalContextType } from '@/types';

// RQ Bubble Colors (from your HTML example)
const rqBubbleColors: { [key: number]: { backgroundColor: string; color: string; } } = {
  0: { backgroundColor: '#9ca3af', color: 'white' },      // gray-400
  1: { backgroundColor: '#fecaca', color: '#7f1d1d' },      // red-200, red-800 text
  2: { backgroundColor: '#fca5a5', color: '#7f1d1d' },      // red-300, red-800 text
  3: { backgroundColor: '#f87171', color: 'white' },      // red-400
  4: { backgroundColor: '#fb923c', color: 'white' },      // orange-400
  5: { backgroundColor: '#f59e0b', color: 'white' },      // amber-500
  6: { backgroundColor: '#d97706', color: 'white' },      // amber-600
};

// Simplified props for now, matching Contact data structure from page.tsx
interface ContactHeaderProps {
  name?: string | null;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  profilePhotoUrl?: string | null;
  relationshipScore?: number | null;
  personalContext?: PersonalContextType | null;
  connectDate?: Date;
  connectCadence?: string | null;
  // Suggestion notification props
  suggestionCount?: number;
  suggestionPriority?: 'high' | 'medium' | 'low';
  hasNewSuggestions?: boolean;
  onViewSuggestions?: () => void;
  // Action handlers - to be implemented
  onRecordNote?: () => void;
  onSendPOG?: () => void;
  onScheduleConnect?: () => void;
}

export const ContactHeader: React.FC<ContactHeaderProps> = ({
  name,
  title,
  company,
  location,
  profilePhotoUrl,
  relationshipScore,
  personalContext,
  connectDate,
  connectCadence,
  suggestionCount = 0,
  suggestionPriority = 'medium',
  hasNewSuggestions = false,
  onViewSuggestions,
  onRecordNote,
  onSendPOG,
  onScheduleConnect,
}) => {

  const rqStyle = rqBubbleColors[relationshipScore ?? 0] || rqBubbleColors[0];

  const userGoal = personalContext?.relationship_goal;

  const actionButtonSx = {
    backgroundColor: '#e5e7eb', // gray-200
    color: '#1f2937', // gray-800
    borderRadius: '0.5rem', // rounded-lg
    padding: '0.625rem 1rem', // py-2.5 px-4
    fontSize: '0.875rem', // text-sm
    fontWeight: 500, // font-medium
    textTransform: 'none', // Keep button text case as is
    width: { xs: '100%', sm: 'auto' },
    '&:hover': {
      backgroundColor: '#d1d5db', // gray-300
    },
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '.emoji': {
        marginRight: '0.5rem'
    }
  };

  return (
    <Paper 
      elevation={0} // Reference uses shadow from a class, we can fine-tune elevation or use sx shadow
      sx={{
        p: { xs: 2, md: 3 }, 
        mb: 2, 
        borderRadius: '0.75rem', // rounded-xl 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)', // Softer shadow-md
        backgroundColor: 'white', // Ensure card background is white against gray page
      }}
    >
      <Box sx={{
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        alignItems: {xs: 'flex-start', md: 'center'}, 
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 }, flexGrow: 1 }}>
          <Avatar 
            src={profilePhotoUrl || undefined} 
            alt={name || 'C'} 
            sx={{
              width: { xs: 80, md: 96 }, 
              height: { xs: 80, md: 96 }, 
              mr: 2,
              border: '2px solid',
              borderColor: rqStyle.backgroundColor // Use RQ color for border for effect
            }}
          >
            {name ? name.charAt(0).toUpperCase() : 'C'}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', fontSize: {xs: '1.75rem', md: '2rem'}, color: '#111827' /* gray-900 */, mr: 1.5 }}>
                {name || 'Unnamed Contact'}
              </Typography>
              {relationshipScore !== undefined && (
                <Chip 
                    label={`RQ${relationshipScore}`}
                    size="small"
                    sx={{
                        backgroundColor: rqStyle.backgroundColor,
                        color: rqStyle.color,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        minWidth: '50px',
                        borderRadius: '9999px',
                        height: 'auto', // to let padding define height
                        padding: '0.3rem 0.75rem',
                    }}
                />
              )}
              {suggestionCount > 0 && onViewSuggestions && (
                <SuggestionNotificationBadge
                  contactId="" // Will be passed from parent
                  count={suggestionCount}
                  onClick={onViewSuggestions}
                  priority={suggestionPriority}
                  hasNewSuggestions={hasNewSuggestions}
                />
              )}
            </Box>
            <Typography sx={{ color: '#4b5563' /* gray-600 */, fontSize: {xs: '0.875rem', md: '1rem'}, display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box component="span" className="emoji" sx={{ mr: 0.75, color: 'text.secondary'}}>💼</Box> 
              {title || 'No Title'} {company ? `at ${company}` : ''}
            </Typography>
            {location && (
              <Typography sx={{ color: '#6b7280' /* gray-500 */, fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
                <Box component="span" className="emoji" sx={{ mr: 0.75, color: 'text.secondary'}}>📍</Box>
                {location}
              </Typography>
            )}
            {userGoal && (
                <Typography sx={{color: '#4f46e5' /* indigo-600 */, fontSize: '0.75rem', fontWeight: 'medium', mt: 0.75}}>
                    My Goal: {userGoal}
                </Typography>
            )}
            {connectCadence && (
                 <Typography sx={{color: '#059669' /* green-600 */, fontSize: '0.75rem', fontWeight: 'medium', mt: 0.5, display: 'flex', alignItems: 'center'}}>
                    <Box component="span" className="emoji" sx={{ mr: 0.75 }}>🟢</Box> {connectCadence}
                </Typography>
            )}
          </Box>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'column' }} spacing={1} sx={{ minWidth: {sm: '180px'}, width: {xs: '100%', sm: 'auto'} }}>
          <Button sx={actionButtonSx} onClick={onRecordNote} aria-label="Record Voice Note">
            <Box component="span" className="emoji">🎙️</Box> Record Note
          </Button>
          <Button sx={actionButtonSx} onClick={onSendPOG} aria-label="Send Packet of Generosity">
            <Box component="span" className="emoji">🎁</Box> Send POG
          </Button>
          <Button sx={actionButtonSx} onClick={onScheduleConnect} aria-label="Schedule Connection">
            <Box component="span" className="emoji">📆</Box> Schedule Connect
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}; 