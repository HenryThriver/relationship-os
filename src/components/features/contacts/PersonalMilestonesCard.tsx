import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import CakeIcon from '@mui/icons-material/Cake';
import HomeIcon from '@mui/icons-material/Home';
import HealingIcon from '@mui/icons-material/Healing'; // Example for injury

// Props to be defined based on data structure
interface Milestone {
    id: string;
    icon?: 'home' | 'birthday' | 'injury' | 'custom'; // to map to icons
    text: string;
    date?: string; // Optional date for the milestone
}

interface PersonalMilestonesCardProps {
  milestones?: Milestone[];
  recentAnecdotes?: string; // For the text block at the bottom
}

const iconMap = {
    home: <HomeIcon fontSize="small" sx={{color: '#10b981' /* green-500 */}}/>,
    birthday: <CakeIcon fontSize="small" sx={{color: '#f59e0b' /* amber-500 */}}/>,
    injury: <HealingIcon fontSize="small" sx={{color: '#ef4444' /* red-500 */}}/>,
    custom: <Typography component="span" sx={{color: '#6366f1' /* indigo-500 */, fontSize: '1.2em', mr:0.5}}>🎉</Typography> // Default custom icon
};

const listItemSx = {
    alignItems: 'flex-start',
    py: 0.5,
    pl:0,
};

const listItemIconSx = {
    minWidth: '32px',
    mt: '2px',
};

const listItemTextSx = {
    color: '#374151', // gray-700
    fontSize: '0.875rem'
};

const ancedotesTextSx = {
    fontSize: '0.8rem',
    color: '#6b7280', // gray-500
    mt: 1,
    whiteSpace: 'pre-wrap'
};

export const PersonalMilestonesCard: React.FC<PersonalMilestonesCardProps> = ({ milestones = [], recentAnecdotes }) => {
  const mockMilestones: Milestone[] = [
    { id: 'm1', icon: 'home', text: 'Recently moved in with partner Julia, combining families.' },
    { id: 'm2', icon: 'injury', text: 'Significant foot/ankle injury from trampoline park (approx. 1.5-2 yrs ago, lasting impact).' },
    { id: 'm3', icon: 'birthday', text: 'His Birthday: (Date TBD)' },
  ];
  const displayMilestones = milestones.length > 0 ? milestones : mockMilestones;

  return (
    <CollapsibleSection title="Personal Milestones & Events" initialOpen>
      {displayMilestones.length > 0 ? (
        <List dense disablePadding>
          {displayMilestones.map((milestone) => (
            <ListItem key={milestone.id} sx={listItemSx}>
              <ListItemIcon sx={listItemIconSx}>
                {milestone.icon ? iconMap[milestone.icon] || iconMap.custom : iconMap.custom}
              </ListItemIcon>
              <ListItemText primary={milestone.text} primaryTypographyProps={{sx: listItemTextSx}} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">No personal milestones logged.</Typography>
      )}
      {(recentAnecdotes || "Attended Yale at 16; reflects on missed growth opportunities.\nManages ADHD (mentioned).\n(Other anecdotes for detailed view: breathwork, sauna, cold plunge, bike rides, weekly shared meal)") && (
        <Typography sx={ancedotesTextSx}>
            RECENT ANECDOTES:
            <br />
            {recentAnecdotes || "Attended Yale at 16; reflects on missed growth opportunities.\nManages ADHD (mentioned).\n(Other anecdotes for detailed view: breathwork, sauna, cold plunge, bike rides, weekly shared meal)"}
        </Typography>
      )}
    </CollapsibleSection>
  );
}; 