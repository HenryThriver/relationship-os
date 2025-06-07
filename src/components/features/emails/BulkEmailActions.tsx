'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import {
  CloudSync as SyncIcon,
  GroupWork as GroupIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email_addresses: string[];
}

interface BulkEmailActionsProps {
  contacts: Contact[];
  onBulkSync?: (contactIds: string[]) => Promise<void>;
  className?: string;
}

export const BulkEmailActions: React.FC<BulkEmailActionsProps> = ({
  contacts,
  onBulkSync,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [syncResults, setSyncResults] = useState<{
    success: number;
    errors: number;
    total: number;
  } | null>(null);

  const handleSelectContact = (contactId: string, checked: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const handleBulkSync = async () => {
    if (!onBulkSync || selectedContacts.size === 0) return;

    setSyncing(true);
    setProgress(0);
    setSyncResults(null);

    const contactIds = Array.from(selectedContacts);
    let completed = 0;
    let errors = 0;

    try {
      // Simulate progressive sync with progress updates
      for (const contactId of contactIds) {
        try {
          // In a real implementation, you'd call the sync API for each contact
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
          
          completed++;
          setProgress((completed / contactIds.length) * 100);
        } catch (error) {
          errors++;
          console.error(`Failed to sync contact ${contactId}:`, error);
        }
      }

      setSyncResults({
        success: completed - errors,
        errors,
        total: contactIds.length,
      });
    } catch (error) {
      console.error('Bulk sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedContacts(new Set());
    setSyncResults(null);
    setProgress(0);
  };

  const contactsWithEmails = contacts.filter(c => c.email_addresses.length > 0);
  const totalEmails = contactsWithEmails.reduce((sum, c) => sum + c.email_addresses.length, 0);

  return (
    <Box className={className}>
      <Button
        variant="outlined"
        startIcon={<GroupIcon />}
        onClick={() => setOpen(true)}
        disabled={contactsWithEmails.length === 0}
      >
        Bulk Email Sync ({contactsWithEmails.length} contacts)
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SyncIcon color="primary" />
            Bulk Email Sync
          </Box>
        </DialogTitle>

        <DialogContent>
          {!syncing && !syncResults && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select contacts to sync emails from Gmail. This will fetch emails from the past 7 days
                for each selected contact.
              </Typography>

              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Chip 
                  icon={<EmailIcon />}
                  label={`${totalEmails} total email addresses`}
                  variant="outlined"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedContacts.size === contactsWithEmails.length}
                      indeterminate={selectedContacts.size > 0 && selectedContacts.size < contactsWithEmails.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  }
                  label="Select All"
                />
              </Box>

              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                <Stack spacing={1}>
                  {contactsWithEmails.map((contact) => (
                    <Box
                      key={contact.id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: selectedContacts.has(contact.id) ? 'action.selected' : 'transparent',
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedContacts.has(contact.id)}
                            onChange={(e) => handleSelectContact(contact.id, e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1">
                              {contact.first_name} {contact.last_name}
                            </Typography>
                            <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                              {contact.email_addresses.map((email, index) => (
                                <Chip
                                  key={index}
                                  label={email}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        }
                        sx={{ width: '100%', margin: 0 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {syncing && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Syncing emails for {selectedContacts.size} contacts...
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                {Math.round(progress)}% complete
              </Typography>
            </Box>
          )}

          {syncResults && (
            <Box>
              <Alert 
                severity={syncResults.errors === 0 ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              >
                Sync completed: {syncResults.success} successful, {syncResults.errors} errors
              </Alert>
              
              <Typography variant="body2">
                Successfully synced emails for {syncResults.success} out of {syncResults.total} contacts.
                {syncResults.errors > 0 && ' Check the logs for error details.'}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            {syncing ? 'Cancel' : 'Close'}
          </Button>
          {!syncing && !syncResults && (
            <Button
              onClick={handleBulkSync}
              variant="contained"
              disabled={selectedContacts.size === 0}
              startIcon={<SyncIcon />}
            >
              Sync {selectedContacts.size} Contact{selectedContacts.size !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkEmailActions; 