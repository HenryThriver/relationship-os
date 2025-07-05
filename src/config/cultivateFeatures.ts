export interface CultivateFeature {
  key: string;
  title: string;
  description: string;
  category: 'intelligence' | 'automation' | 'strategy' | 'communication';
  relevantFor: string[]; // Helper for LLM context
}

export const CULTIVATE_FEATURES: CultivateFeature[] = [
  {
    key: 'contact_intelligence',
    title: 'AI-Powered Contact Intelligence',
    description: 'Automatically capture and organize every detail about your contacts - names, interests, family details, preferences, and conversation history - so you never forget again.',
    category: 'intelligence',
    relevantFor: ['memory', 'details', 'names', 'faces', 'information', 'forgetting', 'remembering']
  },
  {
    key: 'follow_up_automation',
    title: 'Smart Follow-up Automation',
    description: 'Get personalized follow-up suggestions within 24 hours of meeting someone, with draft messages based on your conversation and mutual interests.',
    category: 'automation',
    relevantFor: ['follow-up', 'next steps', 'staying in touch', 'after meeting', 'introductions']
  },
  {
    key: 'relationship_maintenance',
    title: 'Relationship Maintenance System',
    description: 'Automated reminders and suggested touchpoints to maintain consistent communication with your network based on relationship importance and timing.',
    category: 'automation',
    relevantFor: ['consistent', 'outreach', 'system', 'routine', 'maintaining', 'staying connected']
  },
  {
    key: 'generosity_first_networking',
    title: 'Generosity-First Networking',
    description: 'Get suggestions for ways to help others first - introductions you can make, resources you can share, and opportunities you can offer before asking for anything.',
    category: 'strategy',
    relevantFor: ['guilty', 'reaching out', 'need something', 'selfish', 'asking for help', 'giving value']
  },
  {
    key: 'conversation_intelligence',
    title: 'Conversation Intelligence',
    description: 'Pre-event research and conversation starters based on shared interests, recent activities, and mutual connections to make networking feel natural.',
    category: 'communication',
    relevantFor: ['awkward', 'uncomfortable', 'drained', 'conversation', 'events', 'talking', 'small talk']
  },
  {
    key: 'personal_brand_discovery',
    title: 'Personal Brand Discovery',
    description: 'Identify and articulate your unique value proposition, expertise areas, and the specific ways you can help others in your network.',
    category: 'strategy',
    relevantFor: ['confident', 'offer', 'value', 'what to say', 'unique', 'expertise', 'positioning']
  },
  {
    key: 'strategic_networking_roadmap',
    title: 'Strategic Networking Roadmap',
    description: 'Get a personalized action plan with prioritized next steps, key connections to make, and clear milestones toward your networking goals.',
    category: 'strategy',
    relevantFor: ['overwhelmed', 'where to start', 'don\'t know', 'strategy', 'plan', 'goals', 'direction']
  },
  {
    key: 'relationship_analytics',
    title: 'Relationship Analytics & Insights',
    description: 'Track the health and growth of your professional relationships with insights on engagement patterns, communication frequency, and relationship strength.',
    category: 'intelligence',
    relevantFor: ['track', 'measure', 'analytics', 'insights', 'progress', 'effectiveness']
  },
  {
    key: 'smart_introductions',
    title: 'Smart Introduction Engine',
    description: 'Automatically identify and facilitate valuable introductions within your network, creating win-win connections that benefit everyone involved.',
    category: 'automation',
    relevantFor: ['introductions', 'connecting people', 'networking', 'mutual benefit', 'relationships']
  },
  {
    key: 'context_preservation',
    title: 'Context Preservation System',
    description: 'Never lose track of important relationship context - automatically capture meeting notes, shared documents, and conversation history across all touchpoints.',
    category: 'intelligence',
    relevantFor: ['context', 'history', 'notes', 'meetings', 'documents', 'tracking', 'organization']
  }
];

// Helper function to get feature by key
export const getFeatureByKey = (key: string): CultivateFeature | undefined => {
  return CULTIVATE_FEATURES.find(feature => feature.key === key);
};

// Helper function to get features by category
export const getFeaturesByCategory = (category: CultivateFeature['category']): CultivateFeature[] => {
  return CULTIVATE_FEATURES.filter(feature => feature.category === category);
};

// Helper function to create LLM context for feature mapping
export const createFeatureMappingContext = (): string => {
  return CULTIVATE_FEATURES.map(feature => 
    `${feature.key}: ${feature.title} - ${feature.description}`
  ).join('\n');
}; 