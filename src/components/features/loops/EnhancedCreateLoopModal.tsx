import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Alert,
  Slider,
  FormControlLabel,
  Switch,
  Collapse,
  LinearProgress,
  List,
  ListItem
} from '@mui/material';
import {
  GroupAdd as IntroIcon,
  Share as ReferralIcon,
  School as AdviceIcon,
  Handshake as CollabIcon,
  Campaign as ResourceIcon,
  Groups as ConnectionIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  Preview as PreviewIcon,
  AutoAwesome as AIIcon,
  Schedule as TimelineIcon,
  TrendingUp as ValueIcon,
  Flag as UrgencyIcon,
  Groups as GroupsIcon,
  HelpOutline as HelpOutlineIcon,
  Link as LinkIcon,
  Event as EventIcon,
  Workspaces as WorkspacesIcon
} from '@mui/icons-material';
import { LoopType, LoopArtifactContent, LinkedInArtifactContent } from '@/types/artifact';
import { useContactProfile } from '@/lib/hooks/useContactProfile';

interface EnhancedCreateLoopModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<LoopArtifactContent>) => void;
  contactId: string;
  isLoading?: boolean;
  initialData?: Partial<LoopArtifactContent>;
}

const LOOP_TYPE_CONFIGS = {
  [LoopType.INTRODUCTION]: {
    icon: IntroIcon,
    color: '#4CAF50',
    title: 'Introduction (Giving)',
    description: 'Connect two people who could benefit from knowing each other',
    examples: ['Connect Sarah to Mike for marketing advice', 'Introduce founder to potential investor'],
    typical_duration: 14,
    success_criteria: ['Both parties accept introduction', 'Meaningful conversation occurs', 'Mutual value is created']
  },
  [LoopType.REFERRAL]: {
    icon: ReferralIcon,
    color: '#2196F3',
    title: 'Referral (Giving)',
    description: 'Recommend someone for an opportunity or service',
    examples: ['Refer consultant to new client', 'Recommend candidate for job opening'],
    typical_duration: 21,
    success_criteria: ['Referral is accepted', 'Opportunity is pursued', 'Positive outcome achieved']
  },
  [LoopType.RESOURCE_SHARE]: {
    icon: ResourceIcon,
    color: '#FF9800',
    title: 'Resource Share (Giving)',
    description: 'Share valuable resources, tools, or knowledge',
    examples: ['Share industry report', 'Provide access to exclusive tool', 'Send relevant article'],
    typical_duration: 7,
    success_criteria: ['Resource is received', 'Resource is useful', 'Appreciation is expressed']
  },
  [LoopType.ADVICE_OFFER]: {
    icon: AdviceIcon,
    color: '#9C27B0',
    title: 'Advice Offer (Giving)',
    description: 'Offer your expertise or guidance on a topic',
    examples: ['Offer marketing strategy advice', 'Share hiring best practices', 'Provide technical guidance'],
    typical_duration: 10,
    success_criteria: ['Advice is requested', 'Guidance is provided', 'Value is demonstrated']
  },
  [LoopType.INTRODUCTION_REQUEST]: {
    icon: HelpOutlineIcon,
    color: '#00BCD4',
    title: 'Introduction Request (Receiving)',
    description: 'Ask for an introduction to someone specific or a type of contact',
    examples: ['Ask for intro to CEO of X Corp', 'Request connection to marketing experts'],
    typical_duration: 14,
    success_criteria: ['Request acknowledged', 'Introduction is made or attempted', 'Desired connection established']
  },
  [LoopType.ADVICE_REQUEST]: {
    icon: AdviceIcon,
    color: '#E91E63',
    title: 'Advice Request (Receiving)',
    description: 'Ask for guidance or expertise from someone',
    examples: ['Ask for feedback on product', 'Request career advice', 'Seek technical help'],
    typical_duration: 10,
    success_criteria: ['Request is acknowledged', 'Advice is received', 'Guidance is actionable']
  },
  [LoopType.REFERRAL_REQUEST]: {
    icon: LinkIcon,
    color: '#3F51B5',
    title: 'Referral Request (Receiving)',
    description: 'Ask for a referral for a service, product, or opportunity',
    examples: ['Request referral for a good accountant', 'Ask for leads for a new role'],
    typical_duration: 21,
    success_criteria: ['Request is understood', 'Referral is provided if possible', 'Useful connection made']
  },
  [LoopType.COLLABORATION_PROPOSAL]: {
    icon: CollabIcon,
    color: '#607D8B',
    title: 'Collaboration Proposal (Mutual)',
    description: 'Propose working together on a project or initiative',
    examples: ['Joint webinar proposal', 'Co-marketing opportunity', 'Partnership discussion'],
    typical_duration: 30,
    success_criteria: ['Proposal is considered', 'Terms are discussed', 'Agreement is reached']
  },
  [LoopType.CONNECTION_FACILITATION]: {
    icon: GroupsIcon,
    color: '#795548',
    title: 'Connection Facilitation (Mutual)',
    description: 'Help facilitate or manage a connection between parties',
    examples: ['Follow up on an introduction', 'Coordinate a group meeting'],
    typical_duration: 10,
    success_criteria: ['Connection is made easier', 'Logistical hurdles overcome', 'Parties are grateful']
  },
  [LoopType.MEETING_COORDINATION]: {
    icon: EventIcon,
    color: '#FF5722',
    title: 'Meeting Coordination (Mutual)',
    description: 'Coordinate and schedule a meeting with the contact',
    examples: ['Schedule a coffee chat', 'Set up a project kickoff meeting'],
    typical_duration: 5,
    success_criteria: ['Meeting time agreed', 'Meeting is scheduled', 'Attendees confirm']
  },
  [LoopType.PROJECT_COLLABORATION]: {
    icon: WorkspacesIcon,
    color: '#009688',
    title: 'Project Collaboration (Mutual)',
    description: 'Work together on a defined project or task',
    examples: ['Collaborate on a document', 'Jointly develop a feature'],
    typical_duration: 45,
    success_criteria: ['Roles are clear', 'Project milestones are met', 'Successful project completion']
  }
};

const STEPS = ['Select Type', 'Add Details', 'Set Expectations', 'Review & Create'];

export const EnhancedCreateLoopModal: React.FC<EnhancedCreateLoopModalProps> = ({
  open,
  onClose,
  onSubmit,
  contactId,
  isLoading = false,
  initialData
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<Partial<LoopArtifactContent>>({
    reciprocity_direction: 'giving',
    urgency: 'medium',
    estimated_value: 3,
    expected_timeline: 14,
    relationship_depth: 'developing',
    ...initialData
  });

  const { contact } = useContactProfile(contactId);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
    // Reset form when modal is closed or initialData changes significantly (e.g. for a new loop)
    if (!open) {
      setActiveStep(0);
      setFormData({
        reciprocity_direction: 'giving',
        urgency: 'medium',
        estimated_value: 3,
        expected_timeline: 14,
        relationship_depth: 'developing'
        // Do not spread initialData here as it might be stale
      });
    }
  }, [open, initialData]);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    const finalFormData = { ...formData };
    if (!finalFormData.success_criteria && finalFormData.type && LOOP_TYPE_CONFIGS[finalFormData.type]) {
      finalFormData.success_criteria = LOOP_TYPE_CONFIGS[finalFormData.type].success_criteria;
    }
    onSubmit(finalFormData);
  };

  const handleClose = () => {
    // Reset state handled by useEffect on `open` change
    onClose();
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!formData.type && !!formData.reciprocity_direction;
      case 1:
        return !!formData.title && formData.title.trim() !== '' && !!formData.description && formData.description.trim() !== '';
      case 2:
        return !!formData.expected_timeline && formData.expected_timeline > 0 && !!formData.urgency;
      default:
        return true;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose} // Changed from onClose to handleClose for internal reset logic
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '600px' // Consider using vh or theme spacing for responsiveness
        }
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, pb: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight="600">
            Create New Loop
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {contact && (
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <Avatar 
              sx={{ width: 32, height: 32 }} 
              src={contact?.linkedin_data && typeof contact.linkedin_data === 'object' && (contact.linkedin_data as Record<string, any>).profilePicture ? (contact.linkedin_data as Record<string, any>).profilePicture : undefined}
            >
              {contact?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              Creating loop with {contact.name}
            </Typography>
          </Box>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Content */}
      <DialogContent sx={{ px: 3, py: 0 }}>
        {/* Step 1: Select Type */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2}}>
              What type of loop would you like to create?
            </Typography>

            {/* Direction Selection */}
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Direction
              </Typography>
              <Box display="flex" gap={1}>
                <Chip
                  label="Giving (POG)"
                  color={formData.reciprocity_direction === 'giving' ? 'success' : 'default'}
                  onClick={() => setFormData(prev => ({ ...prev, reciprocity_direction: 'giving' }))}
                  variant={formData.reciprocity_direction === 'giving' ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer'}}
                />
                <Chip
                  label="Receiving (Ask)"
                  color={formData.reciprocity_direction === 'receiving' ? 'info' : 'default'}
                  onClick={() => setFormData(prev => ({ ...prev, reciprocity_direction: 'receiving' }))}
                  variant={formData.reciprocity_direction === 'receiving' ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer'}}
                />
              </Box>
            </Box>

            {/* Loop Type Cards */}
            <Grid container spacing={2}>
              {Object.entries(LOOP_TYPE_CONFIGS).map(([type, config]) => (
                <Grid size={{ xs: 12, sm: 6 }} key={type}>
                  <Card
                    variant={formData.type === type ? 'outlined' : 'elevation'}
                    elevation={formData.type === type ? 0 : 1}
                    sx={{
                      border: formData.type === type ? `2px solid ${config.color}` : '1px solid transparent',
                      borderColor: formData.type === type ? config.color : 'transparent',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': { 
                        transform: 'translateY(-2px)',
                        boxShadow: (theme) => theme.shadows[4]
                      }
                    }}
                  >
                    <CardActionArea
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        type: type as LoopType,
                        title: prev.title || config.title, // Pre-fill title if not already set
                        description: prev.description || '', // Keep description if user started typing
                        expected_timeline: config.typical_duration,
                        success_criteria: config.success_criteria // Store default criteria
                      }))}
                      sx={{ p: 2, height: '100%' }}
                    >
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Avatar sx={{ bgcolor: config.color, width: 40, height: 40 }}>
                          <config.icon />
                        </Avatar>
                        <Typography variant="h6" fontWeight="600">
                          {config.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={2} sx={{ minHeight: '40px'}}>
                        {config.description}
                      </Typography>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="500">
                          Examples:
                        </Typography>
                        {config.examples.slice(0, 2).map((example, idx) => (
                          <Typography key={idx} variant="caption" display="block" color="text.secondary">
                            • {example}
                          </Typography>
                        ))}
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Step 2: Add Details */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2}}>
              Tell us about this loop
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Loop Title"
                  placeholder="Brief, descriptive title for this loop (e.g., Introduce to Investor)"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  autoFocus
                  helperText={!formData.title?.trim() ? "Title is required" : ""}
                  error={!formData.title?.trim()}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  placeholder="What specifically are you offering or asking for? Be clear and concise."
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  helperText={!formData.description?.trim() ? "Description is required" : ""}
                  error={!formData.description?.trim()}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Context & Why (Optional)"
                  placeholder="Why is this loop important? What's the background or mutual benefit?"
                  value={formData.context || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                />
              </Grid>

              {/* AI-Powered Suggestions Placeholder */}
              <Grid size={{ xs: 12 }}>
                <Collapse in={!!contact?.name}> {/* Only show if contact is loaded */}
                  <Alert severity="info" icon={<AIIcon />}>
                    <Typography variant="body2">
                      💡 Based on your recent conversations with {contact?.name}, you might also want to:
                    </Typography>
                    {/* This is a placeholder - real suggestions would be dynamic */}
                    <Box mt={1}>
                      <Chip size="small" label="Introduce them to Sarah for advice" sx={{ mr: 1, mb: 1 }} onClick={() => { /* TODO */ }} />
                      <Chip size="small" label="Share the latest marketing report" sx={{ mr: 1, mb: 1 }} onClick={() => { /* TODO */ }} />
                    </Box>
                  </Alert>
                </Collapse>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 3: Set Expectations */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2}}>
              Set expectations and timeline
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center'}}>
                    <UrgencyIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Urgency Level
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.urgency || 'medium'}
                      onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                    >
                      <MenuItem value="low">Low - No rush</MenuItem>
                      <MenuItem value="medium">Medium - Standard timeline</MenuItem>
                      <MenuItem value="high">High - Time sensitive</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center'}}>
                    <TimelineIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Expected Timeline
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={formData.expected_timeline || 14}
                    onChange={(e) => setFormData(prev => ({ ...prev, expected_timeline: parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 1 }))}
                    InputProps={{ endAdornment: <Typography variant="body2" color="text.secondary" sx={{ml: 0.5}}>days</Typography> }}
                    inputProps={{ min: 1 }}
                    helperText={!(formData.expected_timeline && formData.expected_timeline > 0) ? "Must be at least 1 day" : ""}
                    error={!(formData.expected_timeline && formData.expected_timeline > 0)}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center'}}>
                    <ValueIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Estimated Value/Impact (1-5)
                  </Typography>
                  <Slider
                    value={formData.estimated_value || 3}
                    onChange={(_, value) => setFormData(prev => ({ ...prev, estimated_value: value as number }))}
                    min={1}
                    max={5}
                    step={1}
                    marks={[
                      { value: 1, label: 'Low' },
                      { value: 2, label: '2' },
                      { value: 3, label: 'Medium' },
                      { value: 4, label: '4' },
                      { value: 5, label: 'High' }
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Success Criteria (Defaults from Loop Type)
                </Typography>
                {/* This section assumes success_criteria is an array of strings */}
                {formData.success_criteria && formData.success_criteria.length > 0 ? (
                  formData.success_criteria.map((criteria, idx) => (
                    <FormControlLabel
                      key={idx}
                      control={<Switch defaultChecked size="small" disabled />}
                      label={criteria}
                      sx={{ display: 'block'}} // Make each take full width
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">No default success criteria for this loop type, or will be added on creation.</Typography>
                )}
                {/* TODO: Allow editing/adding success criteria in a future iteration */}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 4: Review & Create */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2}}>
              Review your loop with {contact?.name || 'contact'}
            </Typography>

            <Card variant="outlined" sx={{ mb: 3, bgcolor: 'grey.50' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {formData.type && LOOP_TYPE_CONFIGS[formData.type] && (
                    <Avatar sx={{ bgcolor: LOOP_TYPE_CONFIGS[formData.type].color, width: 48, height: 48 }}>
                      {React.createElement(LOOP_TYPE_CONFIGS[formData.type].icon, { fontSize: "large" })}
                    </Avatar>
                  )}
                  <Box flex={1}>
                    <Typography variant="h5" fontWeight="500">{formData.title || "Untitled Loop"}</Typography>
                    <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                      <Chip
                        size="small"
                        label={formData.reciprocity_direction === 'giving' ? 'You are Giving' : 'You are Receiving (Asking)'}
                        color={formData.reciprocity_direction === 'giving' ? 'success' : 'info'}
                      />
                      {formData.urgency && <Chip size="small" label={`Urgency: ${formData.urgency}`} variant="outlined" />}
                      {formData.expected_timeline && <Chip size="small" label={`Timeline: ${formData.expected_timeline} days`} variant="outlined" />}
                      {formData.estimated_value && <Chip size="small" label={`Value: ${formData.estimated_value}/5`} variant="outlined" />}
                    </Box>
                  </Box>
                </Box>

                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap'}}>
                  {formData.description || "No description provided."}
                </Typography>

                {formData.context && (
                  <Box mb={2}>
                    <Typography variant="subtitle1" fontWeight="500" gutterBottom>Context & Why</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap'}}>
                      {formData.context}
                    </Typography>
                  </Box>
                )}

                {formData.success_criteria && formData.success_criteria.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" fontWeight="500" gutterBottom>Success Criteria</Typography>
                    <List dense disablePadding>
                      {formData.success_criteria.map((criteria, idx) => (
                         <ListItem key={idx} disableGutters sx={{py: 0.25}}>
                           <Typography variant="body2" color="text.secondary">• {criteria}</Typography>
                         </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Alert severity="info" icon={<PreviewIcon />}>
              <Typography variant="body2">
                Your loop will be created with status "Idea". You can then manage its progress from the contact's timeline.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose} disabled={isLoading} color="inherit">
          Cancel
        </Button>
        
        <Box sx={{ flexGrow: 1 }} /> {/* Spacer */}

        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={isLoading} startIcon={<BackIcon />}>
            Back
          </Button>
        )}

        {activeStep < STEPS.length - 1 ? (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={!isStepValid(activeStep) || isLoading}
            sx={{ minWidth: '100px'}}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={isLoading || !isStepValid(activeStep)}
            startIcon={isLoading ? <LinearProgress color="inherit" sx={{ mr: 1, width: '20px' }} /> : <AIIcon />}
            sx={{ minWidth: '150px'}}
          >
            {isLoading ? 'Creating Loop...' : 'Create Loop'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}; 