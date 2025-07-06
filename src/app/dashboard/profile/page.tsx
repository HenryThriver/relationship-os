'use client';

import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  LinearProgress, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Alert,
  Avatar,
  Paper
} from '@mui/material';
import { 
  Person, 
  Psychology, 
  Handshake, 
  Flag, 
  Refresh, 
  Warning,
  WorkOutline,
  EmojiObjects,
  RecordVoiceOver,
  TrendingUp,
  School,
  LinkedIn,
  Star,
  Visibility
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useOnboardingState } from '@/lib/hooks/useOnboardingState';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { OnboardingState } from '@/types/userProfile';

interface ProfessionalContextData {
  professional_brief?: string;
  unique_value_proposition?: string;
  zone_of_genius?: string;
  writing_voice?: string;
  how_they_come_across?: string;
  expertise_areas?: string[];
  thought_leadership_topics?: string[];
  core_competencies?: string[];
  personal_brand_pillars?: string[];
  key_messaging_themes?: string[];
  strategic_interests?: string[];
  ideal_connections?: string[];
  reciprocity_opportunities?: string[];
  career_trajectory?: string;
  growth_areas?: string[];
  communication_style?: string;
}

interface PersonalContextData {
  professional_values?: string[];
  motivations?: string[];
  interests?: string[];
  passions?: string[];
}

// Goal Contact Card Component
interface GoalContactCardProps {
  contact: NonNullable<OnboardingState['imported_goal_contacts']>[0];
}

const GoalContactCard: React.FC<GoalContactCardProps> = ({ contact }) => {
  const router = useRouter();
  
  // Query for voice memo insights about this contact
  const { data: voiceMemoInsight } = useQuery({
    queryKey: ['voiceMemoInsight', contact.id],
    queryFn: async () => {
      // Query for voice memo insights
      const { data, error } = await supabase
        .from('artifacts')
        .select('id, content, metadata, transcription, contact_id, created_at, ai_processing_completed_at')
        .eq('type', 'voice_memo')
        .eq('contact_id', contact.id)
        .contains('metadata', { memo_type: 'profile_enhancement' })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) return null;
      return data[0];
    },
    enabled: !!contact.id
  });

  // Process voice memo insight for display
  const voiceInsight = useMemo(() => {
    if (!voiceMemoInsight) return null;
    
    // Get relationship summary from metadata
    const relationshipSummary = (voiceMemoInsight.metadata as Record<string, unknown>)?.relationship_summary as string;
    
    // Get fallback insight from transcription or content
    const fallbackInsight = voiceMemoInsight.transcription || 
                           (typeof voiceMemoInsight.content === 'string' ? voiceMemoInsight.content : null);
    
    // Return appropriate insight
    if (relationshipSummary) {
      return relationshipSummary;
    } else if (voiceMemoInsight.ai_processing_completed_at) {
      return fallbackInsight;
    } else {
      return null; // Still processing
    }
  }, [voiceMemoInsight]);

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        border: '1px solid', 
        borderColor: 'grey.200',
        borderRadius: 2,
        '&:hover': {
          borderColor: 'primary.main',
          cursor: 'pointer'
        }
      }}
      onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {contact.profile_picture && (
          <Avatar 
            src={contact.profile_picture} 
            alt={contact.name}
            sx={{ width: 48, height: 48 }}
          />
        )}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h6" component="h3">
              {contact.name}
            </Typography>
            <Chip 
              label="Associated with Goal" 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {contact.title}{contact.company && ` at ${contact.company}`}
          </Typography>
          
          {/* Voice Memo Insight */}
          {voiceInsight && (
            <Box 
              sx={{ 
                mt: 1, 
                p: 1, 
                backgroundColor: 'grey.50', 
                borderRadius: 1,
                fontStyle: 'italic',
                fontSize: '0.875rem',
                lineHeight: 1.43
              }}
            >
              💡 {voiceInsight}
            </Box>
          )}
          
          {/* LinkedIn Activity */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <LinkedIn fontSize="small" color="primary" />
            <Typography variant="body2" color="text.secondary">
              {contact.recent_posts_count} posts in last 3 months • Profile imported
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default function UserProfilePage() {
  const router = useRouter();
  const { profile, isLoading, profileCompletion } = useUserProfile();
  const { state: onboardingState, isComplete: onboardingComplete, restartOnboarding, isRestarting } = useOnboardingState();
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);

  // Extract professional and personal context data
  const professionalContext = (profile?.professional_context as ProfessionalContextData) || {};
  const personalContext = (profile?.personal_context as PersonalContextData) || {};

  // Extract LinkedIn data for profile image
  const linkedInData = profile?.linkedin_data as unknown as { profilePicture?: string; profile_picture?: string };
  const profileImage = linkedInData?.profilePicture || linkedInData?.profile_picture;

  const handleRestartOnboarding = async () => {
    try {
      setRestartError(null);
      await restartOnboarding();
      setShowRestartDialog(false);
      // Redirect to onboarding to start fresh
      router.push('/onboarding');
    } catch (error) {
      console.error('Failed to restart onboarding:', error);
      setRestartError(error instanceof Error ? error.message : 'Failed to restart onboarding');
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Typography>Loading your profile...</Typography>
        </Box>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Connection OS!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Let&apos;s get started by setting up your profile
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/onboarding')}
            sx={{ px: 6, py: 2 }}
          >
            Start Onboarding
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Profile Image */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
          {profileImage && (
            <Avatar 
              src={profileImage} 
              alt={profile.name || 'Profile'} 
              sx={{ width: 80, height: 80, border: '3px solid', borderColor: 'primary.main' }}
            />
          )}
          <Box sx={{ flex: 1 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Person />
              {profile.name || 'My Profile'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
              {profile.title && profile.company 
                ? `${profile.title} at ${profile.company}`
                : 'Professional networking profile and insights'
              }
            </Typography>
            {profile.linkedin_url && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <LinkedIn fontSize="small" color="primary" />
                <Typography variant="body2" color="primary">
                  LinkedIn Profile Connected
        </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Profile Completion */}
      {profileCompletion && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Profile Completion
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={profileCompletion.completion_percentage} 
                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary">
                {profileCompletion.completion_percentage}%
              </Typography>
            </Box>
            {profileCompletion.suggestions && Array.isArray(profileCompletion.suggestions) && profileCompletion.suggestions.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Suggestions to improve your profile:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profileCompletion.suggestions.map((suggestion, index) => (
                    <Chip key={index} label={suggestion} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Professional Brief */}
      {professionalContext.professional_brief && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star color="primary" />
              Professional Brief
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              {professionalContext.professional_brief}
            </Typography>
            
            {/* Key Insights */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {professionalContext.unique_value_proposition && (
                <Box sx={{ flex: 1, minWidth: '300px' }}>
                  <Paper sx={{ p: 2, bgcolor: 'primary.50', borderLeft: 4, borderLeftColor: 'primary.main' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Unique Value Proposition
                    </Typography>
                    <Typography variant="body2">
                      {professionalContext.unique_value_proposition}
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              {professionalContext.zone_of_genius && (
                <Box sx={{ flex: 1, minWidth: '300px' }}>
                  <Paper sx={{ p: 2, bgcolor: 'success.50', borderLeft: 4, borderLeftColor: 'success.main' }}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      Zone of Genius
                    </Typography>
                    <Typography variant="body2">
                      {professionalContext.zone_of_genius}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

             {/* Personal Brand & Communication */}
       <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
         {/* Personal Brand Pillars */}
         {professionalContext.personal_brand_pillars && Array.isArray(professionalContext.personal_brand_pillars) && professionalContext.personal_brand_pillars.length > 0 && (
           <Box sx={{ flex: 1, minWidth: '300px' }}>
             <Card>
               <CardContent>
                 <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   <Visibility color="primary" />
                   Personal Brand Pillars
                 </Typography>
                 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                   {professionalContext.personal_brand_pillars.map((pillar, index) => (
                     <Chip key={index} label={pillar} color="primary" variant="outlined" />
                   ))}
                 </Box>
               </CardContent>
             </Card>
           </Box>
         )}

         {/* Communication Style */}
         {(professionalContext.writing_voice || professionalContext.how_they_come_across || professionalContext.communication_style) && (
           <Box sx={{ flex: 1, minWidth: '300px' }}>
             <Card>
               <CardContent>
                 <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   <RecordVoiceOver color="primary" />
                   Communication Style
                 </Typography>
                 {professionalContext.writing_voice && (
                   <Box sx={{ mb: 2 }}>
                     <Typography variant="body2" color="text.secondary">Writing Voice:</Typography>
                     <Typography variant="body2">{professionalContext.writing_voice}</Typography>
                   </Box>
                 )}
                 {professionalContext.how_they_come_across && (
                   <Box sx={{ mb: 2 }}>
                     <Typography variant="body2" color="text.secondary">How You Come Across:</Typography>
                     <Typography variant="body2">{professionalContext.how_they_come_across}</Typography>
                   </Box>
                 )}
                 {professionalContext.communication_style && (
                   <Box>
                     <Typography variant="body2" color="text.secondary">Communication Style:</Typography>
                     <Typography variant="body2">{professionalContext.communication_style}</Typography>
                   </Box>
                 )}
               </CardContent>
             </Card>
           </Box>
         )}
       </Box>

             {/* Expertise & Thought Leadership */}
       <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
         {/* Expertise Areas */}
         {professionalContext.expertise_areas && Array.isArray(professionalContext.expertise_areas) && professionalContext.expertise_areas.length > 0 && (
           <Box sx={{ flex: 1, minWidth: '300px' }}>
             <Card>
               <CardContent>
                 <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   <WorkOutline color="primary" />
                   Expertise Areas
                 </Typography>
                 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                   {professionalContext.expertise_areas.map((area, index) => (
                     <Chip key={index} label={area} size="small" color="primary" />
                   ))}
                 </Box>
               </CardContent>
             </Card>
           </Box>
         )}

         {/* Thought Leadership Topics */}
         {professionalContext.thought_leadership_topics && Array.isArray(professionalContext.thought_leadership_topics) && professionalContext.thought_leadership_topics.length > 0 && (
           <Box sx={{ flex: 1, minWidth: '300px' }}>
             <Card>
               <CardContent>
                 <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   <EmojiObjects color="primary" />
                   Thought Leadership Topics
                 </Typography>
                 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                   {professionalContext.thought_leadership_topics.map((topic, index) => (
                     <Chip key={index} label={topic} size="small" color="secondary" />
                   ))}
                 </Box>
               </CardContent>
             </Card>
           </Box>
         )}
       </Box>

      {/* Strategic Positioning */}
      {(professionalContext.career_trajectory || professionalContext.strategic_interests || professionalContext.ideal_connections || professionalContext.growth_areas) && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp color="primary" />
              Strategic Positioning
            </Typography>
            
            {professionalContext.career_trajectory && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Career Trajectory:
                </Typography>
                <Typography variant="body1">
                  {professionalContext.career_trajectory}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {professionalContext.strategic_interests && Array.isArray(professionalContext.strategic_interests) && professionalContext.strategic_interests.length > 0 && (
                <Box sx={{ flex: 1, minWidth: '300px' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Strategic Interests:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {professionalContext.strategic_interests.map((interest, index) => (
                      <Chip key={index} label={interest} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {professionalContext.ideal_connections && Array.isArray(professionalContext.ideal_connections) && professionalContext.ideal_connections.length > 0 && (
                <Box sx={{ flex: 1, minWidth: '300px' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Ideal Connections:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {professionalContext.ideal_connections.map((connection, index) => (
                      <Chip key={index} label={connection} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {professionalContext.growth_areas && Array.isArray(professionalContext.growth_areas) && professionalContext.growth_areas.length > 0 && (
                <Box sx={{ flex: 1, minWidth: '300px' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Growth Areas:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {professionalContext.growth_areas.map((area, index) => (
                      <Chip key={index} label={area} size="small" color="info" />
                    ))}
                  </Box>
                </Box>
              )}

              {professionalContext.reciprocity_opportunities && Array.isArray(professionalContext.reciprocity_opportunities) && professionalContext.reciprocity_opportunities.length > 0 && (
                <Box sx={{ flex: 1, minWidth: '300px' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Reciprocity Opportunities:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {professionalContext.reciprocity_opportunities.map((opportunity, index) => (
                      <Chip key={index} label={opportunity} size="small" color="success" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Original sections with enhanced styling */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Basic Information */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person fontSize="small" />
              Basic Information
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{profile.name || 'Not set'}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{profile.email || 'Not set'}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">Company</Typography>
                <Typography variant="body1">{profile.company || 'Not set'}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <Typography variant="body2" color="text.secondary">Title</Typography>
                <Typography variant="body1">{profile.title || 'Not set'}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Flag fontSize="small" />
              Goals
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Primary Goal</Typography>
                <Typography variant="body1">{profile.primary_goal || 'Not set'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{profile.goal_description || 'Not set'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Timeline</Typography>
                <Typography variant="body1">{profile.goal_timeline || 'Not set'}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Networking Challenges */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology fontSize="small" />
              Networking Challenges
            </Typography>
            {profile.networking_challenges && Array.isArray(profile.networking_challenges) && profile.networking_challenges.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.networking_challenges.map((challenge, index) => (
                  <Chip key={index} label={challenge} size="small" />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No challenges recorded yet
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Ways to Help Others */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Handshake fontSize="small" />
              Ways to Help Others
            </Typography>
            {profile.ways_to_help_others && Array.isArray(profile.ways_to_help_others) && profile.ways_to_help_others.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.ways_to_help_others.map((way, index) => (
                  <Chip key={index} label={way} size="small" color="primary" />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No ways to help recorded yet
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Personal Values & Motivations */}
        {(personalContext.professional_values || personalContext.motivations || personalContext.interests || personalContext.passions) && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School fontSize="small" />
                Personal Context
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {personalContext.professional_values && Array.isArray(personalContext.professional_values) && personalContext.professional_values.length > 0 && (
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Professional Values:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {personalContext.professional_values.map((value, index) => (
                        <Chip key={index} label={value} size="small" color="secondary" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {personalContext.motivations && Array.isArray(personalContext.motivations) && personalContext.motivations.length > 0 && (
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Motivations:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {personalContext.motivations.map((motivation, index) => (
                        <Chip key={index} label={motivation} size="small" color="info" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {personalContext.interests && Array.isArray(personalContext.interests) && personalContext.interests.length > 0 && (
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Interests:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {personalContext.interests.map((interest, index) => (
                        <Chip key={index} label={interest} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {personalContext.passions && Array.isArray(personalContext.passions) && personalContext.passions.length > 0 && (
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Passions:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {personalContext.passions.map((passion, index) => (
                        <Chip key={index} label={passion} size="small" color="success" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Goal-Related Contacts */}
        {onboardingState?.imported_goal_contacts && Array.isArray(onboardingState.imported_goal_contacts) && onboardingState.imported_goal_contacts.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person fontSize="small" />
                Goal-Related Contacts ({onboardingState.imported_goal_contacts.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {onboardingState.imported_goal_contacts.map((contact, index) => (
                  <GoalContactCard key={index} contact={contact} />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Onboarding Status */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Onboarding Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">
                Status: {onboardingComplete ? 'Complete' : 'In Progress'}
              </Typography>
              {onboardingState && (
                <Typography variant="body2" color="text.secondary">
                  Current Screen: {onboardingState.current_screen || 1}
                </Typography>
              )}
            </Box>
            
            {restartError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {restartError}
              </Alert>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {!onboardingComplete && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => router.push('/onboarding')}
                >
                  Continue Onboarding
                </Button>
              )}
              
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Refresh />}
                onClick={() => setShowRestartDialog(true)}
                disabled={isRestarting}
              >
                {isRestarting ? 'Restarting...' : 'Restart Onboarding'}
                </Button>
              </Box>
          </CardContent>
        </Card>
      </Box>
      
      {/* Restart Onboarding Confirmation Dialog */}
      <Dialog 
        open={showRestartDialog} 
        onClose={() => setShowRestartDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Restart Onboarding
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to restart the onboarding process? This will:
          </DialogContentText>
          <Box component="ul" sx={{ mt: 2, mb: 2, pl: 2 }}>
            <li>Clear all your current profile information</li>
            <li>Delete your recorded voice memos</li>
            <li>Reset your networking goals and challenges</li>
            <li>Remove any imported contacts from onboarding</li>
            <li>Start the onboarding process from the beginning</li>
          </Box>
          <DialogContentText color="error">
            <strong>This action cannot be undone.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowRestartDialog(false)}
            disabled={isRestarting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRestartOnboarding}
            color="warning"
            variant="contained"
            disabled={isRestarting}
          >
            {isRestarting ? 'Restarting...' : 'Yes, Restart'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 