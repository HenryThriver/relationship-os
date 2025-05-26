import React, { useState, useRef } from 'react';
import { Fab, Box, Paper, MenuList, MenuItem, ListItemIcon, ListItemText, ClickAwayListener, Grow, Popper } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import NoteAddIcon from '@mui/icons-material/NoteAdd'; // For Add Note
import EventIcon from '@mui/icons-material/Event'; // For Add Meeting
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'; // For Add POG
import PanToolIcon from '@mui/icons-material/PanTool'; // For Add Ask (using PanTool as a placeholder)
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // For Add Milestone

// Props will be added later for handling actions
interface QuickAddProps {
  onAddNote: () => void;
  onAddMeeting: () => void;
  onAddPOG: () => void;
  onAddAsk: () => void;
  onAddMilestone: () => void;
}

export const QuickAdd: React.FC<QuickAddProps> = ({
  onAddNote,
  onAddMeeting,
  onAddPOG,
  onAddAsk,
  onAddMilestone,
}) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    }
  }

  const menuItems = [
    { label: 'Add Note', icon: <NoteAddIcon fontSize="small" />, action: onAddNote },
    { label: 'Add Meeting', icon: <EventIcon fontSize="small" />, action: onAddMeeting },
    { label: 'Add POG', icon: <CardGiftcardIcon fontSize="small" />, action: onAddPOG },
    { label: 'Add Ask', icon: <PanToolIcon fontSize="small" />, action: onAddAsk }, // Placeholder icon
    { label: 'Add Milestone', icon: <EmojiEventsIcon fontSize="small" />, action: onAddMilestone },
  ];

  return (
    <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1300 }}> {/* Increased zIndex to be above most things */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleToggle}
        ref={anchorRef}
        sx={{
          backgroundColor: '#4f46e5', // indigo-600
          '&:hover': {
            backgroundColor: '#4338ca', // indigo-700
          },
          width: 56, 
          height: 56,
        }}
      >
        <MoreHorizIcon />
      </Fab>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement="top-end"
        transition
        disablePortal // To ensure it uses the parent Box zIndex context correctly
        sx={{ zIndex: 1300 }} // Ensure Popper itself has high zIndex
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'top-end' ? 'right bottom' : 'left top',
            }}
          >
            <Paper 
                elevation={8} 
                sx={{
                    mb: 1, 
                    borderRadius: '0.5rem', /* rounded-lg */
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)', /* shadow-xl */
                    minWidth: '180px'
                }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={open}
                  id="quick-add-menu"
                  onKeyDown={handleListKeyDown}
                  sx={{ p: 1, '& .MuiMenuItem-root': { borderRadius: '0.25rem', mb: '2px' } }} /* py-1 from HTML example for MenuList items */
                >
                  {menuItems.map((item) => (
                    <MenuItem 
                        key={item.label} 
                        onClick={(event) => { item.action(); handleClose(event); }} 
                        sx={{
                            fontSize: '0.875rem', /* text-sm */
                            color: '#374151', /* gray-700 */
                            padding: '0.375rem 0.75rem', /* py-1.5 px-3 to match HTML */
                            '&:hover': {
                                backgroundColor: '#f3f4f6', /* gray-100 */
                            }
                        }}
                    >
                      <ListItemIcon sx={{minWidth: '32px', color: 'inherit'}}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} />
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
}; 