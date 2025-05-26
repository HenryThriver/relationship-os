import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; // Example icon

// Corrected Props Interface
export interface ConversationStartersProps {
  personal?: string[] | null;
  professional?: string[] | null;
}

const listStyle = {
  pl: 0, // Remove default padding
  '& .MuiListItem-root': {
    paddingLeft: 0, // Ensure no padding on items
    alignItems: 'flex-start',
  },
  '& .MuiListItemIcon-root': {
    minWidth: 'auto',
    marginRight: 1, // Space between icon and text
    marginTop: '4px', // Align icon with first line of text
    color: '#9ca3af', // gray-400 for icon
  },
  '& .MuiListItemText-primary': {
    fontSize: '0.8rem', // text-xs equivalent
    color: '#6b7280', // gray-500
  }
};

const sectionTitleSx = {
  fontSize: '0.875rem', // text-sm
  fontWeight: 500, // font-medium
  color: '#4b5563', // gray-600
  mb: 0.5,
  mt: 1, 
};

export const ConversationStarters: React.FC<ConversationStartersProps> = ({ personal, professional }) => {
  const hasPersonal = personal && personal.length > 0;
  const hasProfessional = professional && professional.length > 0;

  if (!hasPersonal && !hasProfessional) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{p:2, textAlign: 'center'}}>
        No conversation starters available.
      </Typography>
    );
  }

  return (
    <Box sx={{px: {xs: 0, md: 0} }}> 
      {hasPersonal && (
        <Box mb={hasProfessional ? 1.5 : 0}>
          <Typography sx={sectionTitleSx}>Personal</Typography>
          <List dense sx={listStyle}>
            {personal.map((topic, index) => (
              <ListItem key={`personal-${index}`}>
                 {/* Using a generic icon, can be customized or removed */}
                {/* <ListItemIcon><ChatBubbleOutlineIcon fontSize="small" /></ListItemIcon> */}
                <ListItemText primary={`• ${topic}`} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {hasProfessional && hasPersonal && (
        <Divider sx={{my: 1}}/>
      )}

      {hasProfessional && (
        <Box>
          <Typography sx={sectionTitleSx}>Professional</Typography>
          <List dense sx={listStyle}>
            {professional.map((topic, index) => (
              <ListItem key={`professional-${index}`}>
                {/* <ListItemIcon><ChatBubbleOutlineIcon fontSize="small" /></ListItemIcon> */}
                <ListItemText primary={`• ${topic}`} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}; 