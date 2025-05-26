import React from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { ConversationStarters, ConversationStartersProps } from './ConversationStarters'; // Import existing component and its props

// This card will simply wrap the ConversationStarters component, passing only personal topics.
interface PersonalConversationStartersCardProps {
  personalStarters?: string[] | null;
}

export const PersonalConversationStartersCard: React.FC<PersonalConversationStartersCardProps> = ({ personalStarters }) => {
  const mockStarters = [
    "How is settling into the new combined family home with Julia going?",
    "We both went to Yale! What college were you in? Any favorite places/memories on campus?",
    "Ask about his experiences living abroad (Russia, Brazil, UK, Turkey).",
    "Inquire about his passion for working with entrepreneurs."
  ];

  const displayStarters = personalStarters && personalStarters.length > 0 ? personalStarters : (personalStarters === null ? [] : mockStarters) ;

  return (
    <CollapsibleSection title="Personal Conversation Starters" initialOpen>
      <ConversationStarters personal={displayStarters} />
    </CollapsibleSection>
  );
}; 