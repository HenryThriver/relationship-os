import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Button } from '@mui/material';

// This will evolve to LoopStatus and more detailed item structure
export type ActionItemStatus = 'queued' | 'active' | 'pending' | 'closed' | 'brainstorm'; 

interface ActionItem {
  id: string;
  content: string;
  status: ActionItemStatus;
  type: 'pog' | 'ask'; // Directly use the specific union type needed here
}

interface ActionQueuesProps {
  pogs: ActionItem[];
  asks: ActionItem[];
  onBrainstormPogs?: () => void;
}

const ActionList: React.FC<{ 
  title: string; 
  titleColor?: string;
  items: ActionItem[]; 
  itemTextColor?: string;
  type: 'pog' | 'ask'; 
  cardStyle?: object;
}> = ({ title, titleColor, items, itemTextColor, type, cardStyle }) => (
  <Paper 
    elevation={0}
    sx={{
        p: 2,
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)', // Softer shadow-md
        ...cardStyle 
    }}
  >
    <Typography variant="h6" component="h3" sx={{ mb: 1, color: titleColor || 'inherit', fontSize: '1.125rem', fontWeight: 600 }}>{title}</Typography>
    {items.length === 0 ? (
      <Typography variant="body2" color="text.secondary">No {type}s proposed yet.</Typography>
    ) : (
      <List dense disablePadding sx={{ 
        '& .MuiListItemText-primary': { color: itemTextColor || 'inherit', fontSize: '0.875rem' },
        '& .MuiListItem-root': { display: 'list-item', listStyleType: 'disc', ml: 2, pl:0, py: 0.25 }
      }}>
        {items.map(item => (
          <ListItem 
            key={item.id} 
            disableGutters
            >
            <ListItemText 
              primary={item.content} 
            />
          </ListItem>
        ))}
      </List>
    )}
  </Paper>
);

export const ActionQueues: React.FC<ActionQueuesProps> = ({
  pogs = [], // Provide default empty arrays
  asks = [],
  onBrainstormPogs,
}) => {
  const pogCardStyle = {
     backgroundColor: '#f0fdf4', // green-50
     borderLeft: '4px solid', 
     borderColor: '#22c55e', // green-500
  };
  const askCardStyle = {
     backgroundColor: '#fff7ed', // orange-50
     borderLeft: '4px solid', 
     borderColor: '#f97316', // orange-500
  };

  const brainstormButtonSx = {
    backgroundColor: '#22c55e', // green-500
    color: 'white',
    padding: '0.5rem 1rem', // py-2 px-4
    borderRadius: '0.375rem', // rounded-md
    fontSize: '0.875rem', // text-sm
    fontWeight: 500, // font-medium
    display: 'inline-flex', 
    alignItems: 'center',
    marginTop: '0.75rem', // mt-3
    textTransform: 'none',
    '&:hover': {
        backgroundColor: '#16a34a', // green-600
    },
    '.emoji': {
        marginRight: '0.375rem',
    }
  };

  return (
    <Box sx={{mb: 2}}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: {xs: 2, md: 3} }}>
        <Box sx={{ flex: 1 }}>
          <ActionList 
              title="Proposed Generosity" 
              items={pogs} 
              type="pog" 
              cardStyle={pogCardStyle} 
              titleColor="#15803d" /* green-700 */
              itemTextColor="#166534" /* green-800 */
          />
          {onBrainstormPogs && (
            <Button 
              onClick={onBrainstormPogs} 
              sx={brainstormButtonSx}
            >
              <Box component="span" className="emoji">🪄</Box> Brainstorm POGs
            </Button>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <ActionList 
              title="Proposed Asks" 
              items={asks} 
              type="ask" 
              cardStyle={askCardStyle} 
              titleColor="#c2410c" /* orange-700 */
              itemTextColor="#9a3412" /* orange-800 */
          />
        </Box>
      </Box>
      {/* Placeholder for Tabs */}
      <Paper sx={{ mt: 2, p: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider', borderRadius:'0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)' }}>
        <Typography variant="overline" color="text.secondary">
          [Quick Stats / Detailed View Tabs - Coming Soon]
        </Typography>
      </Paper>
    </Box>
  );
}; 