import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
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
  Grid,
  Alert,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { LoopCard } from './LoopCard';
import { useLoops } from '@/lib/hooks/useLoops';
import { LoopArtifact, LoopType, LoopStatus, LoopTemplate } from '@/types/artifact';
import { LoopDetailModal } from './LoopDetailModal';
import { useLoopTemplates } from '@/lib/hooks/useLoopTemplates';

interface LoopDashboardProps {
  contactId: string;
  contactName: string;
}

export const LoopDashboard: React.FC<LoopDashboardProps> = ({
  contactId,
  contactName
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedLoop, setSelectedLoop] = useState<LoopArtifact | null>(null);

  const {
    loops = [],
    isLoading,
    createLoop,
    updateStatus,
    isCreating
  } = useLoops(contactId);

  const { templates = [], isLoading: isLoadingTemplates } = useLoopTemplates();

  const activeLoops = loops.filter(loop =>
    loop.content &&
    ![LoopStatus.COMPLETED, LoopStatus.ABANDONED, LoopStatus.DECLINED].includes(loop.content.status)
  );

  const completedLoops = loops.filter(loop =>
    loop.content &&
    [LoopStatus.COMPLETED, LoopStatus.ABANDONED, LoopStatus.DECLINED].includes(loop.content.status)
  );

  const handleCreateLoop = (formData: {
    title: string;
    description: string;
    type: LoopType;
    reciprocity_direction: 'giving' | 'receiving';
    templateId?: string;
  }) => {
    createLoop(formData);
    setCreateDialogOpen(false);
  };

  // Wrapper for onStatusUpdate to match LoopCard's expected signature
  const handleStatusUpdate = (loopId: string, newStatus: LoopStatus) => {
    updateStatus({ loopId, newStatus });
  };

  if (isLoading) {
    return <Typography>Loading loops...</Typography>;
  }

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Relationship Loops</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Loop
        </Button>
      </Box>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label={`Active (${activeLoops.length})`} />
        <Tab label={`Completed (${completedLoops.length})`} />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          {activeLoops.length === 0 ? (
            <Alert severity="info">
              No active loops. Create one to start tracking a packet of generosity or ask.
            </Alert>
          ) : (
            activeLoops.map(loop => (
              <LoopCard
                key={loop.id}
                loop={loop}
                contactName={contactName}
                onStatusUpdate={handleStatusUpdate}
                onViewDetails={setSelectedLoop}
              />
            ))
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {completedLoops.length === 0 ? (
            <Alert severity="info">No completed loops yet.</Alert>
          ) : (
            completedLoops.map(loop => (
              <LoopCard
                key={loop.id}
                loop={loop}
                contactName={contactName}
                onStatusUpdate={handleStatusUpdate}
                onViewDetails={setSelectedLoop}
              />
            ))
          )}
        </Box>
      )}

      <CreateLoopDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateLoop}
        isLoading={isCreating}
      />

      {selectedLoop && (
        <LoopDetailModal
          open={!!selectedLoop}
          onClose={() => setSelectedLoop(null)}
          loop={selectedLoop}
          contactName={contactName}
          // TODO: Pass actual mutation functions once available in useLoops
          // onUpdateStatus={updateStatus} 
          // onAddAction={(loopId, action) => { console.log('Add action', loopId, action);}}
        />
      )}
    </Paper>
  );
};

interface CreateLoopDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    type: LoopType;
    reciprocity_direction: 'giving' | 'receiving';
    templateId?: string;
  }) => void;
  isLoading: boolean;
}

const CreateLoopDialog: React.FC<CreateLoopDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading
}) => {
  const { templates = [], isLoading: isLoadingTemplates } = useLoopTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '' as string,
    description: '' as string,
    type: LoopType.INTRODUCTION as LoopType,
    reciprocity_direction: 'giving' as 'giving' | 'receiving'
  });

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setFormData({
          title: template.name,
          description: template.description || '',
          type: template.loop_type,
          reciprocity_direction: formData.reciprocity_direction,
        });
      }
    }
  }, [selectedTemplateId, templates, formData.reciprocity_direction]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<LoopType | 'giving' | 'receiving' | string>) => {
    const { name, value } = e.target;
    if (name === 'templateId') {
      setSelectedTemplateId(value as string);
    } else {
      setFormData(prev => ({ ...prev, [name!]: value }));
    }
  };

  const handleSubmit = () => {
    if (!formData.title) return;
    onSubmit({ ...formData, templateId: selectedTemplateId || undefined });
    setFormData({
      title: '',
      description: '',
      type: LoopType.INTRODUCTION,
      reciprocity_direction: 'giving'
    });
    setSelectedTemplateId('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Loop</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth disabled={isLoadingTemplates}>
              <InputLabel id="loop-template-select-label">Use Template (Optional)</InputLabel>
              <Select
                labelId="loop-template-select-label"
                name="templateId"
                value={selectedTemplateId}
                label="Use Template (Optional)"
                onChange={handleChange as any}
              >
                <MenuItem value=""><em>None - Start from scratch</em></MenuItem>
                {isLoadingTemplates ? (
                  <MenuItem value="" disabled><CircularProgress size={20} /></MenuItem>
                ) : (
                  templates.map(template => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} ({template.loop_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              name="title"
              label="Loop Title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={isLoadingTemplates}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              name="description"
              rows={3}
              label="Description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoadingTemplates}
            />
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth disabled={isLoadingTemplates}>
              <InputLabel id="loop-type-label">Loop Type</InputLabel>
              <Select
                labelId="loop-type-label"
                name="type"
                value={formData.type}
                onChange={handleChange as (event: SelectChangeEvent<LoopType>, child: React.ReactNode) => void}
              >
                {Object.values(LoopType).map(loopType => (
                  <MenuItem key={loopType} value={loopType}>
                    {loopType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth disabled={isLoadingTemplates}>
              <InputLabel id="reciprocity-direction-label">Direction</InputLabel>
              <Select
                labelId="reciprocity-direction-label"
                name="reciprocity_direction"
                value={formData.reciprocity_direction}
                onChange={handleChange as (event: SelectChangeEvent<'giving' | 'receiving'>, child: React.ReactNode) => void}
              >
                <MenuItem value="giving">Giving (POG)</MenuItem>
                <MenuItem value="receiving">Receiving (Ask)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.title || isLoading || isLoadingTemplates}
        >
          {isLoading ? 'Creating...' : 'Create Loop'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 