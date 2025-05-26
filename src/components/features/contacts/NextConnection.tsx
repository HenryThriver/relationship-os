import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

// Simplified props, from Contact.next_meeting
interface NextConnectionProps {
  meeting?: {
    title: string;
    dateTime: string;
    location: string;
    platform?: string;
    agendaItems?: { id: string; text: string; type: 'celebrate' | 'open_thread' | 'new_thread' }[];
  } | null;
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Date TBD';
  try {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

const agendaItemStyles = {
  celebrate: { icon: '🎉', color: '#34d399' /* emerald-400 for icon bg or similar */, textColor: '#047857' /* emerald-700 */ },
  open_thread: { icon: '🔗', color: '#fbbf24' /* amber-400 */, textColor: '#b45309' /* amber-700 */ },
  new_thread: { icon: '💡', color: '#60a5fa' /* blue-400 */, textColor: '#1d4ed8' /* blue-700 */ },
};

export const NextConnection: React.FC<NextConnectionProps> = ({ meeting }) => {
  if (!meeting) {
    return (
      <Paper 
        elevation={0}
        sx={{
          p: 2, 
          mb: 2, 
          textAlign: 'center',
          borderRadius: '0.75rem', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)', // Softer shadow-md
          backgroundColor: '#fafafa', 
        }}
      >
        <Typography variant="subtitle1" color="text.secondary">No upcoming connection scheduled.</Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={0}
      sx={{
        p: {xs: 2, md: 3},
        mb: 2, 
        backgroundColor: '#eef2ff', // indigo-50
        borderLeft: '4px solid', 
        borderColor: '#6366f1', // indigo-500
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)', // Softer shadow-md
      }}
    >
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: '#3730a3' /* indigo-800 */, mb: 1.5, fontSize: {xs: '1.25rem', md: '1.5rem'} }}>
        Next Connection: {meeting.title}
      </Typography>
      <Typography variant="body1" sx={{ color: '#4338ca' /* indigo-700 */, fontWeight: 500, mb: 0.5 }}>
        <strong>When:</strong> {formatDate(meeting.dateTime)}
      </Typography>
      <Typography variant="body1" sx={{ color: '#4338ca' /* indigo-700 */, mb: {xs: 2, md: 3} }}>
        <strong>Where:</strong> {meeting.location} {meeting.platform ? `(${meeting.platform})` : ''}
      </Typography>

      {meeting.agendaItems && meeting.agendaItems.length > 0 && (
        <Box mt={{xs: 2, md: 3}}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600, color: '#3730a3' /* indigo-800 */, mb: 2, fontSize: {xs: '1.1rem', md: '1.25rem'} }}>
            Quick Agenda & Talking Points:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
            {[ // Define categories for 3-column layout
              { title: 'Things to Celebrate', type: 'celebrate' as const, icon: agendaItemStyles.celebrate.icon, iconColor: agendaItemStyles.celebrate.color, textColor: agendaItemStyles.celebrate.textColor },
              { title: 'Open Threads', type: 'open_thread' as const, icon: agendaItemStyles.open_thread.icon, iconColor: agendaItemStyles.open_thread.color, textColor: agendaItemStyles.open_thread.textColor },
              { title: 'New Threads to Open', type: 'new_thread' as const, icon: agendaItemStyles.new_thread.icon, iconColor: agendaItemStyles.new_thread.color, textColor: agendaItemStyles.new_thread.textColor },
            ].map(category => {
              const itemsForCategory = meeting.agendaItems?.filter(item => item.type === category.type);
              if (!itemsForCategory || itemsForCategory.length === 0) return null;

              return (
                <Box key={category.type} sx={{ flex: 1, minWidth: {xs: '100%', md: '0'} }}>
                  <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 500, color: category.textColor, mb: 0.5, display: 'flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ fontSize: '1.3em', mr: 0.75, color: category.iconColor }}>{category.icon}</Box>
                    {category.title}:
                  </Typography>
                  <List dense disablePadding>
                    {itemsForCategory.map(item => (
                      <ListItem key={item.id} disableGutters sx={{ pl: 0, alignItems: 'flex-start', display: 'list-item', listStyleType: 'disc', ml: 3}}>
                        <ListItemText 
                          primary={item.text} 
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: category.textColor, // Use category-specific text color
                            sx: { display: 'block'} // ensure it behaves as a block for list item
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Paper>
  );
}; 