import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, CircularProgress, Alert } from '@mui/material';
import { useNextConnection } from '@/lib/hooks/useNextConnection';
import type { ConnectionAgendaItem } from '@/types'; // Assuming ConnectionAgendaItem is the type for items in ConnectionAgenda

interface NextConnectionProps {
  contactId: string;
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Date TBD';
  try {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'Invalid Date';
  }
};

const agendaItemStyles = {
  celebrate: { icon: '🎉', color: '#34d399', textColor: '#047857' },
  open_thread: { icon: '🔗', color: '#fbbf24', textColor: '#b45309' },
  new_thread: { icon: '💡', color: '#60a5fa', textColor: '#1d4ed8' },
};

export const NextConnection: React.FC<NextConnectionProps> = ({ contactId }) => {
  const { 
    nextConnection,
    isLoading,
    error,
    // scheduleConnection, // Available for future actions
    // updateAgenda,       // Available for future actions
    // markCompleted       // Available for future actions
  } = useNextConnection(contactId);

  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ p: 2, mb: 2, textAlign: 'center', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)', backgroundColor: '#fafafa' }}>
        <CircularProgress size={24} />
        <Typography variant="subtitle1" color="text.secondary" sx={{ml: 1, display: 'inline-block'}}>Loading next connection...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)', backgroundColor: '#fff2f2' }}>
        <Alert severity="warning">Could not load next connection: {error.message}</Alert>
      </Paper>
    );
  }

  if (!nextConnection || nextConnection.status === 'completed' || nextConnection.status === 'cancelled') {
    // Also consider if other statuses like 'completed' or 'cancelled' mean no *active* upcoming connection
    return (
      <Paper 
        elevation={0}
        sx={{
          p: 2, 
          mb: 2, 
          textAlign: 'center',
          borderRadius: '0.75rem', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)',
          backgroundColor: '#fafafa', 
        }}
      >
        <Typography variant="subtitle1" color="text.secondary">No upcoming connection scheduled.</Typography>
        {/* TODO: Add a button to schedule one using scheduleConnection mutation */}
      </Paper>
    );
  }

  // Assuming nextConnection.agenda is of type ConnectionAgenda which has an items array
  const agendaItems = nextConnection.agenda?.items;

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
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)', 
      }}
    >
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: '#3730a3', mb: 1.5, fontSize: {xs: '1.25rem', md: '1.5rem'} }}>
        Next Connection: {nextConnection.connection_type || 'Catch-up'} {/* Use connection_type or a default */}
      </Typography>
      <Typography variant="body1" sx={{ color: '#4338ca', fontWeight: 500, mb: 0.5 }}>
        <strong>When:</strong> {formatDate(nextConnection.scheduled_date)}
      </Typography>
      <Typography variant="body1" sx={{ color: '#4338ca', mb: {xs: 2, md: 3} }}>
        <strong>Where:</strong> {nextConnection.location || 'Location TBD'} {/* Add platform if available and needed */}
      </Typography>

      {agendaItems && agendaItems.length > 0 && (
        <Box mt={{xs: 2, md: 3}}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600, color: '#3730a3', mb: 2, fontSize: {xs: '1.1rem', md: '1.25rem'} }}>
            Quick Agenda & Talking Points:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
            {[ 
              { title: 'Things to Celebrate', type: 'celebrate' as const, icon: agendaItemStyles.celebrate.icon, iconColor: agendaItemStyles.celebrate.color, textColor: agendaItemStyles.celebrate.textColor },
              { title: 'Open Threads', type: 'open_thread' as const, icon: agendaItemStyles.open_thread.icon, iconColor: agendaItemStyles.open_thread.color, textColor: agendaItemStyles.open_thread.textColor },
              { title: 'New Threads to Open', type: 'new_thread' as const, icon: agendaItemStyles.new_thread.icon, iconColor: agendaItemStyles.new_thread.color, textColor: agendaItemStyles.new_thread.textColor },
            ].map(category => {
              const itemsForCategory = agendaItems?.filter((item: ConnectionAgendaItem) => item.type === category.type);
              if (!itemsForCategory || itemsForCategory.length === 0) return null;

              return (
                <Box key={category.type} sx={{ flex: 1, minWidth: {xs: '100%', md: '0'} }}>
                  <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 500, color: category.textColor, mb: 0.5, display: 'flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ fontSize: '1.3em', mr: 0.75, color: category.iconColor }}>{category.icon}</Box>
                    {category.title}:
                  </Typography>
                  <List dense disablePadding>
                    {itemsForCategory.map((item: ConnectionAgendaItem) => (
                      <ListItem key={item.id} disableGutters sx={{ pl: 0, alignItems: 'flex-start', display: 'list-item', listStyleType: 'disc', ml: 3}}>
                        <ListItemText 
                          primary={item.text} 
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: category.textColor, 
                            sx: { display: 'block', textDecoration: item.completed ? 'line-through' : 'none'} // Strikethrough if completed
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
      {/* TODO: Add buttons to update agenda or mark as completed using mutations */}
    </Paper>
  );
}; 