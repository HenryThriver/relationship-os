import React from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { ConversationStarters } from './ConversationStarters'; // Import existing component and its props

interface ProfessionalConversationStartersCardProps {
  professionalStarters?: string[] | null;
}

export const ProfessionalConversationStartersCard: React.FC<ProfessionalConversationStartersCardProps> = ({ professionalStarters }) => {
  const mockStarters = [
    "What are the biggest shifts you\'re seeing in how leaders build trust post-pandemic?",
    "How is AI changing the landscape for networking in your programs?",
    "What\'s one non-obvious trait you look for in successful entrepreneurs you coach?",
    "Any new insights from the latest \'Beyond Connections\' cohort?",
    "You\'ve mentioned the importance of Zoom backgrounds; what\'s your top tip for a great virtual presence?"
  ];
  
  const displayStarters = professionalStarters && professionalStarters.length > 0 ? professionalStarters : (professionalStarters === null ? [] : mockStarters);

  return (
    <CollapsibleSection title="Professional Conversation Starters" initialOpen>
      <ConversationStarters professional={displayStarters} />
    </CollapsibleSection>
  );
}; 