// Field path validation for contact update suggestions

// Define valid field paths based on our actual TypeScript schema
export const VALID_FIELD_PATHS = {
  // Direct contact fields
  DIRECT: new Set([
    'name',
    'email', 
    'phone',
    'title',
    'company',
    'location',
    'linkedin_url',
    'notes'
  ]),

  // Personal context field paths (matching PersonalContext interface)
  PERSONAL: new Set([
    'personal_context.family.partner.name',
    'personal_context.family.partner.relationship', 
    'personal_context.family.partner.details',
    'personal_context.family.children',
    'personal_context.family.parents',
    'personal_context.family.siblings',
    'personal_context.interests',
    'personal_context.values',
    'personal_context.milestones',
    'personal_context.anecdotes',
    'personal_context.communication_style',
    'personal_context.relationship_goal',
    'personal_context.conversation_starters.personal',
    'personal_context.conversation_starters.professional',
    'personal_context.key_life_events',
    'personal_context.current_challenges',
    'personal_context.upcoming_changes',
    'personal_context.living_situation',
    'personal_context.hobbies',
    'personal_context.travel_plans',
    'personal_context.motivations',
    'personal_context.education'
  ]),

  // Professional context field paths (matching ProfessionalContext interface)
  PROFESSIONAL: new Set([
    'professional_context.current_role',
    'professional_context.current_company',
    'professional_context.goals',
    'professional_context.background.focus_areas',
    'professional_context.background.previous_companies',
    'professional_context.background.expertise_areas',
    'professional_context.current_ventures',
    'professional_context.speaking_topics',
    'professional_context.achievements',
    'professional_context.current_role_description',
    'professional_context.key_responsibilities',
    'professional_context.team_details',
    'professional_context.work_challenges',
    'professional_context.networking_objectives',
    'professional_context.skill_development',
    'professional_context.career_transitions',
    'professional_context.projects_involved',
    'professional_context.collaborations',
    'professional_context.upcoming_projects',
    'professional_context.skills',
    'professional_context.industry_knowledge',
    'professional_context.mentions.colleagues',
    'professional_context.mentions.clients',
    'professional_context.mentions.competitors',
    'professional_context.mentions.collaborators',
    'professional_context.mentions.mentors',
    'professional_context.mentions.industry_contacts',
    'professional_context.opportunities_to_help',
    'professional_context.introduction_needs',
    'professional_context.resource_needs',
    'professional_context.pending_requests',
    'professional_context.collaboration_opportunities'
  ])
};

// Get all valid field paths as one set
export const ALL_VALID_FIELD_PATHS = new Set([
  ...VALID_FIELD_PATHS.DIRECT,
  ...VALID_FIELD_PATHS.PERSONAL,
  ...VALID_FIELD_PATHS.PROFESSIONAL
]);

// Define which field paths expect arrays vs strings vs objects
export const FIELD_TYPE_EXPECTATIONS = {
  ARRAYS: new Set([
    'personal_context.family.children',
    'personal_context.interests',
    'personal_context.values',
    'personal_context.milestones',
    'personal_context.anecdotes',
    'personal_context.conversation_starters.personal',
    'personal_context.conversation_starters.professional',
    'personal_context.key_life_events',
    'personal_context.current_challenges',
    'personal_context.upcoming_changes',
    'personal_context.hobbies',
    'personal_context.travel_plans',
    'personal_context.motivations',
    'personal_context.education',
    'professional_context.goals',
    'professional_context.background.previous_companies',
    'professional_context.background.expertise_areas',
    'professional_context.speaking_topics',
    'professional_context.achievements',
    'professional_context.key_responsibilities',
    'professional_context.work_challenges',
    'professional_context.networking_objectives',
    'professional_context.skill_development',
    'professional_context.career_transitions',
    'professional_context.projects_involved',
    'professional_context.collaborations',
    'professional_context.upcoming_projects',
    'professional_context.skills',
    'professional_context.industry_knowledge',
    'professional_context.mentions.colleagues',
    'professional_context.mentions.clients',
    'professional_context.mentions.competitors',
    'professional_context.mentions.collaborators',
    'professional_context.mentions.mentors',
    'professional_context.mentions.industry_contacts',
    'professional_context.opportunities_to_help',
    'professional_context.introduction_needs',
    'professional_context.resource_needs',
    'professional_context.pending_requests',
    'professional_context.collaboration_opportunities'
  ]),

  OBJECTS: new Set([
    'personal_context.family.partner'
  ]),

  STRINGS: new Set([
    'name',
    'email',
    'phone', 
    'title',
    'company',
    'location',
    'linkedin_url',
    'notes',
    'personal_context.family.parents',
    'personal_context.family.siblings',
    'personal_context.communication_style',
    'personal_context.relationship_goal',
    'personal_context.living_situation',
    'professional_context.current_role',
    'professional_context.current_company',
    'professional_context.background.focus_areas',
    'professional_context.current_ventures',
    'professional_context.current_role_description',
    'professional_context.team_details'
  ])
};

/**
 * Validates if a field path is valid according to our schema
 */
export function isValidFieldPath(fieldPath: string): boolean {
  return ALL_VALID_FIELD_PATHS.has(fieldPath);
}

/**
 * Gets the expected data type for a field path
 */
export function getExpectedFieldType(fieldPath: string): 'array' | 'object' | 'string' | 'unknown' {
  if (FIELD_TYPE_EXPECTATIONS.ARRAYS.has(fieldPath)) return 'array';
  if (FIELD_TYPE_EXPECTATIONS.OBJECTS.has(fieldPath)) return 'object';
  if (FIELD_TYPE_EXPECTATIONS.STRINGS.has(fieldPath)) return 'string';
  return 'unknown';
}

/**
 * Validates a suggestion against our schema
 */
export function validateSuggestion(suggestion: {
  field_path: string;
  action: 'add' | 'update' | 'remove';
  suggested_value: unknown;
}): { valid: boolean; error?: string } {
  // Check if field path is valid
  if (!isValidFieldPath(suggestion.field_path)) {
    return {
      valid: false,
      error: `Invalid field path: ${suggestion.field_path}. This field does not exist in our contact schema.`
    };
  }

  // Check if data type matches expectation
  const expectedType = getExpectedFieldType(suggestion.field_path);
  const actualType = Array.isArray(suggestion.suggested_value) ? 'array' : typeof suggestion.suggested_value;

  if (expectedType !== 'unknown' && suggestion.action !== 'remove') {
    if (expectedType === 'array' && actualType !== 'array') {
      return {
        valid: false,
        error: `Field ${suggestion.field_path} expects an array, but got ${actualType}. For arrays, use action 'add' with individual items, not the whole array.`
      };
    }
    
    if (expectedType === 'string' && actualType !== 'string') {
      return {
        valid: false,
        error: `Field ${suggestion.field_path} expects a string, but got ${actualType}.`
      };
    }
    
    if (expectedType === 'object' && actualType !== 'object') {
      return {
        valid: false,
        error: `Field ${suggestion.field_path} expects an object, but got ${actualType}.`
      };
    }
  }

  return { valid: true };
}

/**
 * Filters and validates suggestions, returning only valid ones with error logging
 */
interface ValidatedSuggestion {
  field_path: string;
  action: 'add' | 'update' | 'remove';
  suggested_value: unknown;
}

export function validateAndFilterSuggestions(suggestions: unknown[]): ValidatedSuggestion[] {
  const validSuggestions: ValidatedSuggestion[] = [];
  const errors: string[] = [];

  for (const suggestion of suggestions) {
    // Type guard to ensure suggestion has the required structure
    if (
      typeof suggestion === 'object' && 
      suggestion !== null && 
      'field_path' in suggestion && 
      'action' in suggestion && 
      'suggested_value' in suggestion &&
      typeof suggestion.field_path === 'string' &&
      typeof suggestion.action === 'string' &&
      (suggestion.action === 'add' || suggestion.action === 'update' || suggestion.action === 'remove')
    ) {
      const validation = validateSuggestion(suggestion as {
        field_path: string;
        action: 'add' | 'update' | 'remove';
        suggested_value: unknown;
      });
      if (validation.valid) {
        validSuggestions.push(suggestion as ValidatedSuggestion);
      } else {
        errors.push(`Suggestion for ${suggestion.field_path}: ${validation.error}`);
        console.warn(`[Field Validation] ${validation.error}`, suggestion);
      }
    } else {
      errors.push(`Invalid suggestion structure: ${JSON.stringify(suggestion)}`);
      console.warn(`[Field Validation] Invalid suggestion structure:`, suggestion);
    }
  }

  if (errors.length > 0) {
    console.warn(`[Field Validation] Filtered out ${errors.length} invalid suggestions:`, errors);
  }

  return validSuggestions;
}

/**
 * Generates the valid field paths documentation for AI prompts
 */
export function generateFieldPathsForPrompt(): string {
  return `
VALID FIELD PATHS FOR CONTACT UPDATES:

DIRECT CONTACT FIELDS:
${Array.from(VALID_FIELD_PATHS.DIRECT).map(path => `- "${path}" (string)`).join('\n')}

PERSONAL CONTEXT:
${Array.from(VALID_FIELD_PATHS.PERSONAL).map(path => {
  const type = getExpectedFieldType(path);
  return `- "${path}" (${type === 'array' ? 'array of strings - use action "add" for individual items' : type})`;
}).join('\n')}

PROFESSIONAL CONTEXT:
${Array.from(VALID_FIELD_PATHS.PROFESSIONAL).map(path => {
  const type = getExpectedFieldType(path);
  return `- "${path}" (${type === 'array' ? 'array of strings - use action "add" for individual items' : type})`;
}).join('\n')}

IMPORTANT RULES:
- Only use field paths from this exact list
- For array fields, use action "add" with individual string items, not entire arrays
- For object fields like "personal_context.family.partner", use action "update" with the complete object
- Never create new field paths not listed above
`;
} 