import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useLoops } from '@/lib/hooks/useLoops';
import { LoopArtifact, LoopStatus, LoopArtifactContent } from '@/types/artifact';
import { LoopDetailModal } from './LoopDetailModal';
import { EnhancedCreateLoopModal } from './EnhancedCreateLoopModal';
import { EnhancedLoopTimeline } from './EnhancedLoopTimeline';

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
    updateLoopStatus,
    isCreatingLoop,
  } = useLoops(contactId);

  const activeLoops = loops.filter(loop =>
    loop.content &&
    ![LoopStatus.COMPLETED, LoopStatus.ABANDONED, LoopStatus.DECLINED].includes(loop.content.status)
  );

  const completedLoops = loops.filter(loop =>
    loop.content &&
    [LoopStatus.COMPLETED, LoopStatus.ABANDONED, LoopStatus.DECLINED].includes(loop.content.status)
  );

  const handleCreateLoop = (loopData: Partial<LoopArtifactContent>) => {
    if (!loopData.title || !loopData.description || !loopData.type || !loopData.reciprocity_direction) {
      console.error("Missing required fields for loop creation from modal data", loopData);
      return;
    }

    const createLoopArgs = {
      title: loopData.title,
      description: loopData.description,
      type: loopData.type,
      reciprocity_direction: loopData.reciprocity_direction,
      templateId: loopData.template_id,
      status: loopData.status || LoopStatus.IDEA,
      initiator: loopData.initiator || 'user',
      context: loopData.context,
      expected_timeline: loopData.expected_timeline,
      urgency: loopData.urgency,
      estimated_value: loopData.estimated_value,
      success_criteria: loopData.success_criteria,
      inspiration_source: loopData.inspiration_source,
      template_used: loopData.template_used,
      relationship_depth: loopData.relationship_depth,
      previous_loop_success: loopData.previous_loop_success,
      actions: loopData.actions || []
    };

    createLoop(createLoopArgs);
    setCreateDialogOpen(false);
  };

  const handleStatusUpdate = (loopId: string, newStatus: LoopStatus) => {
    if (updateLoopStatus) {
      updateLoopStatus({ loopId, newStatus });
    } else {
      console.warn('updateLoopStatus function not available in useLoops');
    }
  };

  const handleEditLoop = (loopId: string, updates: Partial<LoopArtifactContent>) => {
    console.log('Edit loop action triggered:', loopId, updates);
  };

  const handleDeleteLoop = (loopId: string) => {
    console.log('Delete loop action triggered:', loopId);
  };

  const handleShareLoop = (loopId: string) => {
    console.log('Share loop action triggered:', loopId);
  };

  const handleAddNoteToLoop = (loopId: string, note: string) => {
    console.log('Add note to loop action triggered:', loopId, note);
  };

  if (isLoading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4}} />;
  }

  return (
    <Paper sx={{ p: {xs: 1, sm: 2, md: 3}, mt: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexDirection={{xs: 'column', sm: 'row'}} gap={2}>
        <Typography variant="h6">Relationship Loops</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Loop
        </Button>
      </Box>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }} centered>
        <Tab label={`Active (${activeLoops.length})`} />
        <Tab label={`Completed (${completedLoops.length})`} />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          {activeLoops.length === 0 && !isLoading ? (
            <Alert severity="info" sx={{mt: 2}}>
              No active loops. Create one to start tracking an offer of generosity or an ask.
            </Alert>
          ) : (
            activeLoops.map(loop => (
              <EnhancedLoopTimeline
                key={loop.id}
                artifact={loop}
                contactName={contactName}
                onStatusUpdate={handleStatusUpdate}
                onEdit={handleEditLoop}
                onDelete={handleDeleteLoop}
                onShare={handleShareLoop}
                onAddNote={handleAddNoteToLoop}
              />
            ))
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {completedLoops.length === 0 && !isLoading ? (
            <Alert severity="info" sx={{mt: 2}}>No completed loops yet.</Alert>
          ) : (
            completedLoops.map(loop => (
              <EnhancedLoopTimeline
                key={loop.id}
                artifact={loop}
                contactName={contactName}
                onStatusUpdate={handleStatusUpdate}
                onEdit={handleEditLoop}
                onDelete={handleDeleteLoop}
                onShare={handleShareLoop}
                onAddNote={handleAddNoteToLoop}
              />
            ))
          )}
        </Box>
      )}

      <EnhancedCreateLoopModal
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateLoop}
        contactId={contactId}
        isLoading={isCreatingLoop}
      />

      {selectedLoop && (
        <LoopDetailModal
          open={!!selectedLoop}
          onClose={() => setSelectedLoop(null)}
          loop={selectedLoop}
          contactName={contactName}
        />
      )}
    </Paper>
  );
}; 