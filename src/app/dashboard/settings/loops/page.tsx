'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useLoopTemplates } from '@/lib/hooks/useLoopTemplates';
import { LoopTemplate, LoopType, LoopTemplateAction } from '@/types/artifact';

// --- LoopTemplateFormDialog Component ---
interface LoopTemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (templateData: Omit<LoopTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'> | (Partial<LoopTemplate> & { id: string })) => void;
  initialData?: LoopTemplate | null;
  isLoading: boolean;
}

const LoopTemplateFormDialog: React.FC<LoopTemplateFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loopType, setLoopType] = useState<LoopType>(LoopType.INTRODUCTION);
  const [defaultActionsStr, setDefaultActionsStr] = useState('[]'); // Store as JSON string for TextField

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setLoopType(initialData.loop_type || LoopType.INTRODUCTION);
      setDefaultActionsStr(initialData.default_actions ? JSON.stringify(initialData.default_actions, null, 2) : '[]');
    } else {
      // Reset for new template
      setName('');
      setDescription('');
      setLoopType(LoopType.INTRODUCTION);
      setDefaultActionsStr('[]');
    }
  }, [initialData, open]); // Reset when dialog opens or initialData changes

  const handleSubmit = () => {
    let parsedActions: LoopTemplateAction[] = [];
    try {
      parsedActions = JSON.parse(defaultActionsStr);
      if (!Array.isArray(parsedActions)) throw new Error('Default actions must be a JSON array.');
      // TODO: Add validation for each action object structure if needed
    } catch (e) {
      alert('Invalid JSON format for Default Actions. Please provide a valid JSON array.');
      return;
    }

    const templateData = {
      name,
      description,
      loop_type: loopType,
      default_actions: parsedActions,
      // typical_duration_days, follow_up_schedule_days, completion_criteria can be added here
    };

    if (initialData?.id) {
      onSubmit({ ...templateData, id: initialData.id });
    } else {
      onSubmit(templateData as Omit<LoopTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? 'Edit' : 'Create'} Loop Template</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Template Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="loop-type-template-label">Loop Type</InputLabel>
              <Select
                labelId="loop-type-template-label"
                value={loopType}
                label="Loop Type"
                onChange={(e: SelectChangeEvent<LoopType>) => setLoopType(e.target.value as LoopType)}
              >
                {Object.values(LoopType).map(type => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Default Actions (JSON format)"
              multiline
              rows={5}
              value={defaultActionsStr}
              onChange={(e) => setDefaultActionsStr(e.target.value)}
              helperText='Provide a JSON array of LoopTemplateAction objects. E.g., [{ "action_type": "offer", "description_template": "Initial offer" }]'
            />
          </Grid>
          {/* TODO: Add fields for typical_duration_days, follow_up_schedule_days, completion_criteria */}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isLoading || !name.trim()}>
          {isLoading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Template')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// --- LoopTemplatesPage Component ---
export default function LoopTemplatesPage() {
  const {
    templates = [],
    isLoading,
    isError,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    isCreatingTemplate,
    isUpdatingTemplate,
    isDeletingTemplate,
  } = useLoopTemplates();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LoopTemplate | null>(null);

  const handleOpenCreateDialog = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (template: LoopTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleSubmitTemplate = (
    templateData: Omit<LoopTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'> | (Partial<LoopTemplate> & { id: string })
  ) => {
    if ('id' in templateData && templateData.id) {
      updateTemplate(templateData as Partial<LoopTemplate> & { id: string }, {
        onSuccess: handleCloseDialog,
      });
    } else {
      createTemplate(templateData as Omit<LoopTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>, {
        onSuccess: handleCloseDialog,
      });
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(templateId);
    }
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (isError) {
    return <Alert severity="error">Failed to load loop templates.</Alert>;
  }

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Loop Templates</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
          New Template
        </Button>
      </Box>

      {templates.length === 0 ? (
        <Alert severity="info">No loop templates created yet. Create one to get started!</Alert>
      ) : (
        <List>
          {templates.map((template) => (
            <ListItem key={template.id} divider>
              <ListItemText
                primary={template.name}
                secondary={`${template.loop_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${template.description?.substring(0,100)}${template.description && template.description.length > 100 ? '...' : ''}`}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditDialog(template)} disabled={isUpdatingTemplate || isDeletingTemplate}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteTemplate(template.id)} disabled={isDeletingTemplate || isUpdatingTemplate}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      <LoopTemplateFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitTemplate}
        initialData={editingTemplate}
        isLoading={isCreatingTemplate || isUpdatingTemplate}
      />
    </Paper>
  );
} 