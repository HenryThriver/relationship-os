import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Menu,
  ListItemIcon,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Email,
  Star,
  Work,
  Person,
  AlternateEmail,
  Check,
} from '@mui/icons-material';
import { useContactEmails, validateEmail } from '@/lib/hooks/useContactEmails';
import { ContactEmail, ContactEmailFormData } from '@/types/contact';

interface ContactEmailManagementProps {
  contactId: string;
  contactName?: string;
}

export const ContactEmailManagement: React.FC<ContactEmailManagementProps> = ({
  contactId,
  contactName,
}) => {
  const {
    emails,
    isLoading,
    addEmail,
    updateEmail,
    deleteEmail,
    setPrimaryEmail,
    isAddingEmail,
    isUpdatingEmail,
  } = useContactEmails(contactId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<ContactEmail | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEmail, setSelectedEmail] = useState<ContactEmail | null>(null);

  const [formData, setFormData] = useState<ContactEmailFormData>({
    email: '',
    email_type: 'other',
    is_primary: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleAddEmail = () => {
    setEditingEmail(null);
    setFormData({
      email: '',
      email_type: emails.length === 0 ? 'primary' : 'other',
      is_primary: emails.length === 0,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleEditEmail = (email: ContactEmail) => {
    setEditingEmail(email);
    setFormData({
      email: email.email,
      email_type: email.email_type,
      is_primary: email.is_primary,
    });
    setFormErrors({});
    setDialogOpen(true);
    setMenuAnchorEl(null);
  };

  const handleSubmit = () => {
    const validation = validateEmail(formData.email);
    if (!validation.isValid) {
      setFormErrors({ email: validation.error! });
      return;
    }

    // Check for duplicate emails
    const duplicate = emails.find(
      (e) => 
        e.email.toLowerCase() === formData.email.toLowerCase() && 
        e.id !== editingEmail?.id
    );
    if (duplicate) {
      setFormErrors({ email: 'This email is already added to this contact' });
      return;
    }

    if (editingEmail) {
      updateEmail({
        emailId: editingEmail.id,
        updates: formData,
      });
    } else {
      addEmail(formData);
    }

    setDialogOpen(false);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, email: ContactEmail) => {
    setSelectedEmail(email);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedEmail(null);
  };

  const handleSetPrimary = (email: ContactEmail) => {
    setPrimaryEmail(email.id);
    handleMenuClose();
  };

  const handleDeleteEmail = (email: ContactEmail) => {
    if (window.confirm(`Are you sure you want to remove ${email.email}?`)) {
      deleteEmail(email.id);
    }
    handleMenuClose();
  };

  const getEmailTypeIcon = (type: string) => {
    switch (type) {
      case 'work': return <Work fontSize="small" />;
      case 'personal': return <Person fontSize="small" />;
      case 'primary': return <Star fontSize="small" />;
      default: return <AlternateEmail fontSize="small" />;
    }
  };

  const getEmailTypeColor = (type: string, isPrimary: boolean) => {
    if (isPrimary) return 'primary';
    switch (type) {
      case 'work': return 'info';
      case 'personal': return 'success';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={20} />
            <Typography>Loading emails...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email color="primary" />
            Email Addresses
          </Typography>
          <Button
            startIcon={<Add />}
            onClick={handleAddEmail}
            variant="outlined"
            size="small"
          >
            Add Email
          </Button>
        </Box>

        {emails.length === 0 ? (
          <Alert severity="info">
            No email addresses added yet. Add an email to enable calendar integration.
          </Alert>
        ) : (
          <List disablePadding>
            {emails.map((email, index) => (
              <React.Fragment key={email.id}>
                <ListItem disablePadding>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1">{email.email}</Typography>
                        {email.is_primary && (
                          <Tooltip title="Primary email">
                            <Star color="primary" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={
                      <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                        <Chip
                          size="small"
                          icon={getEmailTypeIcon(email.email_type)}
                          label={email.email_type}
                          color={getEmailTypeColor(email.email_type, email.is_primary) as 'primary' | 'info' | 'success' | 'default'}
                          variant="outlined"
                        />
                        {email.verified && (
                          <Chip
                            size="small"
                            icon={<Check fontSize="small" />}
                            label="Verified"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={(e) => handleMenuClick(e, email)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < emails.length - 1 && <Box sx={{ height: 8 }} />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          {selectedEmail && !selectedEmail.is_primary && (
            <MenuItem onClick={() => handleSetPrimary(selectedEmail)}>
              <ListItemIcon>
                <Star fontSize="small" />
              </ListItemIcon>
              Set as Primary
            </MenuItem>
          )}
          <MenuItem onClick={() => handleEditEmail(selectedEmail!)}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            Edit
          </MenuItem>
          <MenuItem 
            onClick={() => handleDeleteEmail(selectedEmail!)}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            Remove
          </MenuItem>
        </Menu>

        {/* Add/Edit Email Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingEmail ? 'Edit Email Address' : 'Add Email Address'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!formErrors.email}
                helperText={formErrors.email}
                fullWidth
                autoFocus
                type="email"
              />

              <FormControl fullWidth>
                <InputLabel>Email Type</InputLabel>
                <Select
                  value={formData.email_type}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    email_type: e.target.value as ContactEmailFormData['email_type']
                  })}
                  label="Email Type"
                >
                  <MenuItem value="primary">Primary</MenuItem>
                  <MenuItem value="work">Work</MenuItem>
                  <MenuItem value="personal">Personal</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  />
                }
                label="Set as primary email"
              />

              {formData.is_primary && (
                <Alert severity="info">
                  This will become the main email address for {contactName || 'this contact'} 
                  and will be used for calendar integration.
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isAddingEmail || isUpdatingEmail}
            >
              {isAddingEmail || isUpdatingEmail ? (
                <CircularProgress size={20} />
              ) : (
                editingEmail ? 'Update' : 'Add'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}; 