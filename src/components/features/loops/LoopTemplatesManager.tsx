import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Loop as LoopIcon
} from '@mui/icons-material';
import { useLoopTemplates } from '@/lib/hooks/useLoopTemplates';
import { LoopTemplate, LoopType, LoopStatus, LoopTemplateAction } from '@/types/artifact';
import { useToast } from '@/lib/contexts/ToastContext';

interface TemplateFormData {
  name: string;
  loop_type: LoopType;
  description: string;
  default_title_template: string;
  default_status: LoopStatus;
  reciprocity_direction: 'giving' | 'receiving';
  typical_duration: number | null;
  default_actions: LoopTemplateAction[];
  follow_up_schedule: number[];
  completion_criteria: string[];
}

const initialFormData: TemplateFormData = {
  name: '',
  loop_type: LoopType.INTRODUCTION,
  description: '',
  default_title_template: '',
  default_status: LoopStatus.IDEA,
  reciprocity_direction: 'giving',
  typical_duration: null,
  default_actions: [],
  follow_up_schedule: [],
  completion_criteria: []
};

export const LoopTemplatesManager = () => {
  useToast();
  const {
    loopTemplates,
    isLoading,
    error,
    createLoopTemplate,
    updateLoopTemplate,
    deleteLoopTemplate,
    isCreating,
    isUpdating,
    isDeleting
  } = useLoopTemplates();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LoopTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleOpenDialog = (template?: LoopTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        loop_type: template.loop_type,
        description: template.description || '',
        default_title_template: template.default_title_template || '',
        default_status: template.default_status,
        reciprocity_direction: template.reciprocity_direction,
        typical_duration: template.typical_duration ?? null,
        default_actions: template.default_actions || [],
        follow_up_schedule: template.follow_up_schedule || [],
        completion_criteria: template.completion_criteria || []
      });
    } else {
      setEditingTemplate(null);
      setFormData(initialFormData);
    }
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Template name is required';
    }
    
    if (!formData.default_title_template.trim()) {
      errors.default_title_template = 'Default title template is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const templateData = {
        ...formData,
        description: formData.description || null,
        default_title_template: formData.default_title_template || null,
        default_actions: formData.default_actions.length > 0 ? formData.default_actions : null,
        follow_up_schedule: formData.follow_up_schedule.length > 0 ? formData.follow_up_schedule : null,
        completion_criteria: formData.completion_criteria.length > 0 ? formData.completion_criteria : null
      };

      if (editingTemplate) {
        await updateLoopTemplate({ id: editingTemplate.id, ...templateData });
      } else {
        await createLoopTemplate(templateData);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving template:', error);
      // Error handling is done in the hook via toast
    }
  };

  const handleDelete = async (template: LoopTemplate) => {
    if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      try {
        await deleteLoopTemplate(template.id);
      } catch (error) {
        console.error('Error deleting template:', error);
        // Error handling is done in the hook via toast
      }
    }
  };

  const formatLoopType = (type: LoopType): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatLoopStatus = (status: LoopStatus): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading loop templates: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LoopIcon color="primary" />
          Loop Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={isCreating}
        >
          Create Template
        </Button>
      </Box>

      {loopTemplates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No loop templates yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Create your first template to streamline loop creation
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Your First Template
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Direction</TableCell>
                <TableCell>Default Status</TableCell>
                <TableCell>Duration (days)</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loopTemplates.map((template) => (
                <TableRow key={template.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {template.name}
                      </Typography>
                      {template.description && (
                        <Typography variant="caption" color="text.secondary">
                          {template.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={formatLoopType(template.loop_type)} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={template.reciprocity_direction.charAt(0).toUpperCase() + template.reciprocity_direction.slice(1)}
                      size="small"
                      color={template.reciprocity_direction === 'giving' ? 'success' : 'info'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={formatLoopStatus(template.default_status)} 
                      size="small"
                      color="default"
                    />
                  </TableCell>
                  <TableCell>
                    {template.typical_duration || 'Not set'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(template)}
                      disabled={isUpdating || isDeleting}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(template)}
                      disabled={isUpdating || isDeleting}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTemplate ? 'Edit Loop Template' : 'Create Loop Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
              required
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Loop Type</InputLabel>
                <Select
                  value={formData.loop_type}
                  label="Loop Type"
                  onChange={(e) => setFormData({ ...formData, loop_type: e.target.value as LoopType })}
                >
                  {Object.values(LoopType).map((type) => (
                    <MenuItem key={type} value={type}>
                      {formatLoopType(type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Reciprocity Direction</InputLabel>
                <Select
                  value={formData.reciprocity_direction}
                  label="Reciprocity Direction"
                  onChange={(e) => setFormData({ ...formData, reciprocity_direction: e.target.value as 'giving' | 'receiving' })}
                >
                  <MenuItem value="giving">Giving</MenuItem>
                  <MenuItem value="receiving">Receiving</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />

            <TextField
              label="Default Title Template"
              value={formData.default_title_template}
              onChange={(e) => setFormData({ ...formData, default_title_template: e.target.value })}
              error={!!formErrors.default_title_template}
              helperText={formErrors.default_title_template || "Use {{contact_name}} for dynamic substitution"}
              fullWidth
              required
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Default Status</InputLabel>
                <Select
                  value={formData.default_status}
                  label="Default Status"
                  onChange={(e) => setFormData({ ...formData, default_status: e.target.value as LoopStatus })}
                >
                  {Object.values(LoopStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {formatLoopStatus(status)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Typical Duration (days)"
                type="number"
                value={formData.typical_duration || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  typical_duration: e.target.value ? parseInt(e.target.value) : null 
                })}
                fullWidth
              />
            </Box>

            {/* Advanced Options Accordion */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Advanced Options</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Follow-up Schedule (days, comma-separated)"
                    value={formData.follow_up_schedule.join(', ')}
                    onChange={(e) => {
                      const values = e.target.value
                        .split(',')
                        .map(v => v.trim())
                        .filter(v => v && !isNaN(Number(v)))
                        .map(v => parseInt(v));
                      setFormData({ ...formData, follow_up_schedule: values });
                    }}
                    helperText="e.g., 1, 3, 7, 14 (days after delivery)"
                    fullWidth
                  />

                  <TextField
                    label="Completion Criteria (one per line)"
                    value={formData.completion_criteria.join('\n')}
                    onChange={(e) => {
                      const criteria = e.target.value
                        .split('\n')
                        .map(c => c.trim())
                        .filter(c => c);
                      setFormData({ ...formData, completion_criteria: criteria });
                    }}
                    multiline
                    rows={3}
                    fullWidth
                  />
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? (
              <CircularProgress size={20} />
            ) : (
              editingTemplate ? 'Update Template' : 'Create Template'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 