import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  SelectChangeEvent,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { LoopArtifact, LoopStatus, LoopType, LoopAction, LoopArtifactContent } from '@/types/artifact';
import { useLoops } from '@/lib/hooks/useLoops';
import { LoopStatusBadge } from '@/components/ui/LoopStatusBadge';
import { format } from 'date-fns'; // For date formatting

interface LoopDetailModalProps {
  open: boolean;
  onClose: () => void;
  loop: LoopArtifact | null;
  contactName: string;
  // Props for mutations will be implicitly handled by useLoops within the modal
}

export const LoopDetailModal: React.FC<LoopDetailModalProps> = ({
  open,
  onClose,
  loop,
  contactName,
}) => {
  if (!loop) return null;

  // Instantiate useLoops here to get access to addAction and its loading state
  // Note: This will re-fetch loops for the contactId, which might be redundant if
  // LoopDashboard already has them. For simplicity now, we call it.
  // A more optimized approach might involve passing mutations down or using a shared context.
  const { addAction, isAddingAction, updateStatus, isUpdating } = useLoops(loop.contact_id);

  const [newActionNotes, setNewActionNotes] = useState('');
  const [newActionType, setNewActionType] = useState<LoopAction['action_type']>('check_in');

  const handleStatusChange = (newStatus: LoopStatus) => {
    if (isUpdating) return; // Prevent multiple submissions
    updateStatus({ loopId: loop.id, newStatus }, {
      onSuccess: () => {
        // Optionally close modal or give other feedback specific to status update
        // The useLoops hook already shows a toast.
        // The loop object passed as prop will become stale, list will refresh though.
      }
    });
  };

  const handleFormSubmitAddAction = () => {
    if (!newActionNotes.trim() || isAddingAction) return;
    
    const actionData: Omit<LoopAction, 'id' | 'created_at'> = {
      action_type: newActionType,
      notes: newActionNotes,
      status: loop.content.status, // Action inherits current loop status, or could be specific
      // due_date, completed_at could be part of a more complex form
    };

    addAction({ loopId: loop.id, actionData }, {
      onSuccess: () => {
        setNewActionNotes('');
        setNewActionType('check_in'); // Reset form
        // Modal will reflect changes once the 'loops' query for the dashboard invalidates and refetches
        // Or if we manage a local copy of the loop details here and update it.
      },
      onError: (error) => {
        // useLoops hook already shows a toast
        console.error("Error adding action from modal:", error);
      }
    });
  };
  
  const loopContent = loop.content as LoopArtifactContent;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {loopContent.title}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Loop Details</Typography>
          <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb:1}}>
            <LoopStatusBadge status={loopContent.status} />
            <FormControl size="small" sx={{ minWidth: 180 }} disabled={isUpdating}>
              <InputLabel id="loop-status-update-label">Update Status</InputLabel>
              <Select
                labelId="loop-status-update-label"
                value={loopContent.status}
                label="Update Status"
                onChange={(e: SelectChangeEvent<LoopStatus>) => handleStatusChange(e.target.value as LoopStatus)}
              >
                {Object.values(LoopStatus).map(s => (
                  <MenuItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Typography variant="body1" sx={{ mt: 1 }}><strong>Description:</strong> {loopContent.description}</Typography>
          <Typography variant="body2" color="text.secondary"><strong>Type:</strong> {loopContent.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Typography>
          <Typography variant="body2" color="text.secondary"><strong>Direction:</strong> {loopContent.reciprocity_direction === 'giving' ? 'Giving (POG)' : 'Receiving (Ask)'}</Typography>
          <Typography variant="body2" color="text.secondary"><strong>Created:</strong> {format(new Date(loop.created_at), 'PPP p')}</Typography>
          <Typography variant="body2" color="text.secondary"><strong>Last Updated:</strong> {format(new Date(loop.updated_at), 'PPP p')}</Typography>
          <Typography variant="body2" color="text.secondary"><strong>Contact:</strong> {contactName}</Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Actions & History</Typography>
          {loopContent.actions && loopContent.actions.length > 0 ? (
            <List dense>
              {loopContent.actions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((action) => (
                <ListItem key={action.id} secondaryAction={
                  <Typography variant="caption">{format(new Date(action.created_at), 'P p')}</Typography>
                }>
                  <ListItemText 
                    primary={`${action.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (${action.status})`}
                    secondary={action.notes || 'No notes'} 
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>No actions logged yet.</Typography>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>Log New Action</Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel id="new-action-type-label">Action Type</InputLabel>
            <Select
              labelId="new-action-type-label"
              value={newActionType}
              label="Action Type"
              onChange={(e: SelectChangeEvent<LoopAction['action_type']>) => setNewActionType(e.target.value as LoopAction['action_type'])}
            >
              <MenuItem value="offer">Offer</MenuItem>
              <MenuItem value="delivery">Delivery</MenuItem>
              <MenuItem value="follow_up">Follow-up</MenuItem>
              <MenuItem value="check_in">Check-in</MenuItem>
              <MenuItem value="approval_request">Approval Request</MenuItem>
              <MenuItem value="completion">Completion</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Action Notes/Description"
            multiline
            rows={3}
            value={newActionNotes}
            onChange={(e) => setNewActionNotes(e.target.value)}
            helperText={!newActionNotes.trim() ? "Notes are required to add an action." : ""}
          />
          <Button 
            variant="outlined" 
            onClick={handleFormSubmitAddAction}
            startIcon={<AddIcon />}
            disabled={!newActionNotes.trim() || isAddingAction}
          >
            {isAddingAction ? 'Adding...' : 'Add Action'}
          </Button>
        </Box>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}; 