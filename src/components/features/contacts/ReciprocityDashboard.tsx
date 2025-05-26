import React from 'react';
import { Box, Typography, Paper, LinearProgress, List, ListItem, ListItemText } from '@mui/material';

// Simplified props for now
export interface ExchangeItem {
  id: string;
  type: 'given' | 'received'; // Reflects direction from current user's perspective
  content: string;
  category?: string;
  timestamp: string;
}

interface ReciprocityDashboardProps {
  balance?: number; // Example: -1 (more received) to +1 (more given)
  healthIndex?: number; // Example: 0-10 score
  status?: 'balanced' | 'over-giving' | 'under-giving' | 'neutral';
  recentExchanges?: ExchangeItem[];
  outstandingCommitments?: { id: string; text: string }[];
}

export const ReciprocityDashboard: React.FC<ReciprocityDashboardProps> = ({
  balance = 0,
  healthIndex = 5,
  status = 'neutral',
  recentExchanges = [],
  outstandingCommitments = [],
}) => {
  // Normalize balance from -1 to 1 to a 0-100 scale for the progress bar
  const normalizedBalance = (balance + 1) * 50;

  const getStatusText = () => {
    if (status === 'over-giving') return 'More Given by You';
    if (status === 'under-giving') return 'More Received by You';
    return 'Balanced';
  };

  const reciprocityBarStyle = {
    height: '8px',
    borderRadius: '4px',
    backgroundColor: '#e5e7eb', // gray-200
    position: 'relative',
    overflow: 'hidden',
    mt: 0.25,
  };

  const reciprocityBarFillStyle = {
    height: '100%',
    borderRadius: '4px',
    backgroundColor: '#60a5fa', // blue-400
    width: `${normalizedBalance}%`,
    transition: 'width 0.3s ease-in-out',
  };

  const reciprocityMarkerStyle = {
    width: '2px',
    height: '12px',
    backgroundColor: '#ef4444', // red-500
    position: 'absolute',
    top: '-2px',
    left: '50%',
    transform: 'translateX(-50%)',
  };

  const exchangeItemBaseSx = {
    p: 1,
    borderRadius: '0.375rem',
    mb: 0.5,
    borderLeft: '4px solid',
  };

  return (
    <Paper 
      elevation={0}
      sx={{
        p: {xs: 2, md: 3},
        mb: 2,
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)', // Softer shadow-md
        backgroundColor: 'white', // Ensure card background is white
      }}
    >
      <Typography variant="h6" component="h3" sx={{ mb: 1, fontWeight: 600, color: '#374151' /* gray-700 */ }}>
        Exchanges & Reciprocity
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, px: 0.5 }}>
        <Typography variant="caption" color="text.secondary">More Received</Typography>
        <Typography variant="caption" sx={{ fontWeight: 'medium' }}>{getStatusText()}</Typography>
        <Typography variant="caption" color="text.secondary">More Given</Typography>
      </Box>
      <Box sx={reciprocityBarStyle}>
        <Box sx={reciprocityBarFillStyle} />
        <Box sx={reciprocityMarkerStyle} />
      </Box>
      <Typography variant="body2" color="text.secondary" align="center" sx={{my: 1, fontSize: '0.75rem'}}>
        (To be updated based on logged POGs/Asks)
      </Typography>
      { healthIndex !== undefined &&
        <Typography variant="body2" color="text.secondary" align="center" sx={{mb: 2}}>
            Relationship Health: {healthIndex?.toFixed(1)}/10
        </Typography>
      }

      <Box sx={{ display: 'flex', flexDirection: {xs: 'column', md: 'row'}, gap: {xs: 2, md: 3}, mt: 2}}>
        <Box sx={{flex:1}}>
          <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 500, color: '#059669' /* green-700 */, mb: 1 }}>
            Given by You / To Them:
          </Typography>
          {recentExchanges.filter(ex => ex.type === 'given').length > 0 ? (
            <List dense disablePadding>
              {recentExchanges.filter(ex => ex.type === 'given').map(ex => (
                <Paper key={ex.id} component={ListItem} sx={{ ...exchangeItemBaseSx, backgroundColor: '#d1fae5' /* green-100 */, borderColor: '#10b981' /* green-500 */}} elevation={0}>
                  <ListItemText primary={ex.content} secondary={ex.category} primaryTypographyProps={{fontWeight: 500}} />
                </Paper>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
              (Log introductions, resources shared, support offered)
            </Typography>
          )}
        </Box>

        <Box sx={{flex:1}}>
          <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 500, color: '#2563eb' /* blue-600 */, mb: 1 }}>
            Received by You / From Them:
          </Typography>
          {recentExchanges.filter(ex => ex.type === 'received').length > 0 ? (
            <List dense disablePadding>
              {recentExchanges.filter(ex => ex.type === 'received').map(ex => (
                <Paper key={ex.id} component={ListItem} sx={{ ...exchangeItemBaseSx, backgroundColor: '#dbeafe' /* blue-100 */, borderColor: '#3b82f6' /* blue-600 */}} elevation={0}>
                  <ListItemText primary={ex.content} secondary={ex.category} primaryTypographyProps={{fontWeight: 500}} />
                </Paper>
              ))}
            </List>
          ) : (
             <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
              (Log advice, intros received, help given)
            </Typography>
          )}
        </Box>
      </Box>

      {outstandingCommitments.length > 0 && (
        <Box mt={3} pt={2} borderTop={1} borderColor="divider">
          <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 500, color: '#dc2626' /* red-600 */, mb: 0.5 }}>
            Outstanding Commitments:
          </Typography>
          <List dense disablePadding>
            {outstandingCommitments.map(commit => (
              <ListItem key={commit.id} disableGutters sx={{pl: 1}}>
                <ListItemText primary={`• ${commit.text}`} primaryTypographyProps={{variant: 'body2', color: '#4b5563' /* gray-600 */}}/>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
}; 