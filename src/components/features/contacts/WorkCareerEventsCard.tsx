import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import MicIcon from '@mui/icons-material/Mic'; // For Keynote
import WorkIcon from '@mui/icons-material/Work'; // For Joined Ferrazzi Greenlight
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'; // For Launched Program
import FoundationIcon from '@mui/icons-material/Foundation'; // For Founded Company

interface EventItem {
    id: string;
    icon?: 'keynote' | 'joined_company' | 'launched_program' | 'founded_company' | 'custom';
    text: string;
    detail?: string; // e.g. (ca. 2020)
}

interface WorkCareerEventsCardProps {
  events?: EventItem[];
}

const iconMap = {
    keynote: <MicIcon fontSize="small" sx={{color: '#6366f1' /* indigo-500 */}}/>,
    joined_company: <WorkIcon fontSize="small" sx={{color: '#10b981' /* green-500 */}}/>,
    launched_program: <RocketLaunchIcon fontSize="small" sx={{color: '#f59e0b' /* amber-500 */}}/>,
    founded_company: <FoundationIcon fontSize="small" sx={{color: '#3b82f6' /* blue-500 */}}/>,
    custom: <Typography component="span" sx={{color: '#6366f1', fontSize: '1.2em', mr:0.5}}>🚀</Typography>
};

const listItemSx = {
    alignItems: 'flex-start',
    py: 0.5,
    pl: 0,
};

const listItemIconSx = {
    minWidth: '32px',
    mt: '2px',
};

const listItemTextPrimarySx = {
    color: '#374151', // gray-700
    fontSize: '0.875rem',
    fontWeight: 500,
};

const listItemTextSecondarySx = {
    color: '#6b7280', // gray-500
    fontSize: '0.75rem',
};

export const WorkCareerEventsCard: React.FC<WorkCareerEventsCardProps> = ({ events = [] }) => {
  const mockEvents: EventItem[] = [
    { id: 'e1', icon: 'keynote', text: 'Recent Keynote for Fortune 50 company in N. Europe.' },
    { id: 'e2', icon: 'joined_company', text: 'Joined Ferrazzi Greenlight', detail: '(ca. 2020)' },
    { id: 'e3', icon: 'launched_program', text: 'Launched Connected Success / Beyond Connections program', detail: '(Recent)' },
    { id: 'e4', icon: 'founded_company', text: 'Cross Campus Founded', detail: '(ca. 2012)' },
  ];
  const displayEvents = events.length > 0 ? events : mockEvents;

  return (
    <CollapsibleSection title="Work & Career Events" initialOpen>
      {displayEvents.length > 0 ? (
        <List dense disablePadding>
          {displayEvents.map((event) => (
            <ListItem key={event.id} sx={listItemSx}>
              <ListItemIcon sx={listItemIconSx}>
                {event.icon ? iconMap[event.icon] || iconMap.custom : iconMap.custom}
              </ListItemIcon>
              <ListItemText 
                primary={event.text}
                secondary={event.detail || null}
                primaryTypographyProps={{sx: listItemTextPrimarySx}}
                secondaryTypographyProps={{sx: listItemTextSecondarySx}}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">No work or career events logged.</Typography>
      )}
    </CollapsibleSection>
  );
}; 