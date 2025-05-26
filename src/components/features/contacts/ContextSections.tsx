import React from 'react';
import { Box } from '@mui/material';

// Import the new card components
import { FamilyCard } from './FamilyCard';
import { ProfessionalSnapshotCard } from './ProfessionalSnapshotCard';
import { PersonalMilestonesCard } from './PersonalMilestonesCard';
import { WorkCareerEventsCard } from './WorkCareerEventsCard';
import { PersonalInterestsCard } from './PersonalInterestsCard';
import { ProfessionalExpertiseCard } from './ProfessionalExpertiseCard';
import { PersonalConversationStartersCard } from './PersonalConversationStartersCard';
import { ProfessionalConversationStartersCard } from './ProfessionalConversationStartersCard';

// Import the comprehensive Contact type and related types from @/types
import type { 
    Contact as GlobalContact, 
    ExperienceItem, 
    EducationItem, 
    FamilyMember, 
    GoalItem, 
    VentureItem 
} from '@/types';

// The contactData prop will now be of type GlobalContact (or a compatible subset/extension)
interface ContextSectionsProps {
  contactData: GlobalContact; // Use GlobalContact for the prop type
}

export const ContextSections: React.FC<ContextSectionsProps> = ({ contactData }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 
        Pass relevant slices of contactData to each card.
        For now, many will use their internal mock data due to missing fields in current mock `Contact` type.
        This will be connected properly when we integrate real data / update Contact type.
      */}
      <FamilyCard familyMembers={contactData.familyMembers ?? []} />
      <ProfessionalSnapshotCard 
        about={contactData.about}
        experience={contactData.experience}
        education={contactData.education}
        linkedin_profile_url={contactData.linkedin_url}
        hisGoals={contactData.hisGoals ?? []}
        currentVentures={contactData.currentVentures ?? []}
        keySkills={contactData.keySkills ?? []}
      />
      <PersonalMilestonesCard 
        // milestones={contactData.personalMilestones} - Add to Contact type and mock
        // recentAnecdotes={contactData.recentAnecdotes} - Add to Contact type and mock
      />
      <WorkCareerEventsCard 
        // events={contactData.workCareerEvents} - Add to Contact type and mock
      />
      <PersonalInterestsCard 
        interests={contactData.personalInterests ?? []}
        // values={contactData.personalValues ?? []} - Add to Contact type and mock
      />
      <ProfessionalExpertiseCard 
        expertiseTags={contactData.professionalExpertise ?? []}
        // keySkills={contactData.keySkills ?? []} - Add to Contact type and mock
      />
      <PersonalConversationStartersCard personalStarters={contactData.conversationStarters?.personal ?? []} />
      <ProfessionalConversationStartersCard professionalStarters={contactData.conversationStarters?.professional ?? []} />
    </Box>
  );
}; 