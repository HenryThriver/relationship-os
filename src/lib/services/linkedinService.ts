import type { Contact } from '@/types/contact';
import type { LinkedInArtifact, LinkedInArtifactContent } from '@/types/artifact';
import type { Json } from '@/lib/supabase/types_db';

// Type definitions for LinkedIn API response structures
interface DateRange {
  start: {
    month?: string | number;
    year?: string | number;
  };
  end?: {
    month?: string | number;
    year?: string | number;
  };
}

interface LocationData {
  basicLocation?: {
    city?: string;
    countryCode?: string;
  };
}

// interface ProfilePicture {
//   width: number;
//   height: number;
//   url: string;
// }

/**
 * Processes the raw API response from a LinkedIn profile scrape.
 * Generates a structured LinkedIn artifact and synthesizes key information 
 * for updating the main contact record and its professional context.
 *
 * @param apiResponse - The raw JSON response from the LinkedIn profile API.
 * @param contactId - The ID of the contact this LinkedIn profile is associated with.
 * @returns An object containing `contactUpdates` (for the contacts table) 
 *          and `linkedinArtifact` (to be stored in the artifacts table).
 */
export const processLinkedInProfile = (apiResponse: Record<string, unknown>, contactId: string): {
  contactUpdates: Partial<Contact>;
  linkedinArtifact: LinkedInArtifact;
} => {
  // Type guards for apiResponse
  const getString = (obj: Record<string, unknown>, key: string): string | undefined => {
    const val = obj[key];
    return typeof val === 'string' ? val : undefined;
  };
  const getArray = (obj: Record<string, unknown>, key: string): Array<Record<string, unknown>> => {
    const val = obj[key];
    return Array.isArray(val) ? (val as Array<Record<string, unknown>>) : [];
  };

  const getProfilePicture = (obj: Record<string, unknown>): string | undefined => {
    const profilePictures = obj.profilePictures;
    if (Array.isArray(profilePictures) && profilePictures.length > 0) {
      // Prefer 200x200 size, fall back to first available
      const preferred = profilePictures.find((pic: { width: number; height: number }) => pic.width === 200 && pic.height === 200);
      const selected = preferred || profilePictures[0];
      return typeof selected?.url === 'string' ? selected.url : undefined;
    }
    // Fallback for older API responses that might have a single profilePicture field
    return getString(obj, 'profilePicture');
  };

  const getDateRange = (obj: Record<string, unknown>): DateRange | null => {
    if (obj.dateRange && typeof obj.dateRange === 'object' && obj.dateRange !== null) {
      const dateRange = obj.dateRange as Record<string, unknown>;
      if ('start' in dateRange && typeof dateRange.start === 'object' && dateRange.start !== null) {
        const start = dateRange.start as Record<string, unknown>;
        const end = 'end' in dateRange && dateRange.end && typeof dateRange.end === 'object' && dateRange.end !== null 
          ? dateRange.end as Record<string, unknown> 
          : undefined;
        
        return {
          start: {
            month: typeof start.month === 'string' || typeof start.month === 'number' ? start.month : undefined,
            year: typeof start.year === 'string' || typeof start.year === 'number' ? start.year : undefined,
          },
          end: end ? {
            month: typeof end.month === 'string' || typeof end.month === 'number' ? end.month : undefined,
            year: typeof end.year === 'string' || typeof end.year === 'number' ? end.year : undefined,
          } : undefined,
        };
      }
    }
    return null;
  };

  const getLocation = (obj: Record<string, unknown>): LocationData | null => {
    if (obj.location && typeof obj.location === 'object' && obj.location !== null) {
      const location = obj.location as Record<string, unknown>;
      if ('basicLocation' in location && typeof location.basicLocation === 'object' && location.basicLocation !== null) {
        const basicLocation = location.basicLocation as Record<string, unknown>;
        return {
          basicLocation: {
            city: typeof basicLocation.city === 'string' ? basicLocation.city : undefined,
            countryCode: typeof basicLocation.countryCode === 'string' ? basicLocation.countryCode : undefined,
          }
        };
      }
    }
    return null;
  };

  // Extract profile picture URL
  const profilePictureUrl = getProfilePicture(apiResponse);

  // Create LinkedIn artifact with comprehensive data from the API response
  const linkedinArtifactContent: LinkedInArtifactContent = {
    profile_url: getString(apiResponse, 'profile_url') || getString(apiResponse, 'public_identifier') || '',
    headline: getString(apiResponse, 'headline') || '',
    about: getString(apiResponse, 'summary') || getString(apiResponse, 'about') || '',
    profilePicture: profilePictureUrl, // Store in artifact metadata
    experience: getArray(apiResponse, 'experiences').map((exp) => {
      const dateRange = getDateRange(exp);
      const duration = dateRange 
        ? `${dateRange.start.month || ''}/${dateRange.start.year || ''} - ${dateRange.end ? `${dateRange.end.month || ''}/${dateRange.end.year || ''}` : 'Present'}`
        : getString(exp, 'duration') || '';
      
      return {
        company: getString(exp, 'companyName') || getString(exp, 'company') || '',
        title: getString(exp, 'title') || '',
        duration,
        description: getString(exp, 'description') || ''
      };
    }),
    education: getArray(apiResponse, 'education').map((edu) => {
      const dateRange = getDateRange(edu);
      const years = dateRange 
        ? `${dateRange.start.year || ''} - ${dateRange.end ? dateRange.end.year || '' : 'Present'}`
        : getString(edu, 'years') || '';
      
      return {
        school: getString(edu, 'schoolName') || getString(edu, 'school') || '',
        degree: getString(edu, 'degreeName') || getString(edu, 'degree') || '',
        field: getString(edu, 'fieldOfStudy') || getString(edu, 'field') || '',
        years
      };
    }),
    scraped_at: new Date().toISOString()
  };

  const linkedinArtifact: LinkedInArtifact = {
    id: '', // ID will be generated by Supabase upon insertion
    contact_id: contactId,
    user_id: '', // user_id will be set by the calling service/hook based on the authenticated user
    type: 'linkedin_profile',
    content: `LinkedIn Profile for ${apiResponse.firstName || ''} ${apiResponse.lastName || ''}`.trim() + (linkedinArtifactContent.headline ? ` - ${linkedinArtifactContent.headline}` : ''),
    metadata: linkedinArtifactContent,
    timestamp: linkedinArtifactContent.scraped_at,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Synthesize key data for the main contact record update
  const contactUpdates: Partial<Contact> = {
    // Basic Info - ensure name is constructed if only firstName/lastName are present
    name: (getString(apiResponse, 'firstName') && getString(apiResponse, 'lastName'))
      ? `${getString(apiResponse, 'firstName') || ''} ${getString(apiResponse, 'lastName') || ''}`.trim()
      : getString(apiResponse, 'name') || '',
    company: (() => {
      const experiences = getArray(apiResponse, 'experiences');
      if (experiences.length > 0) {
        return getString(experiences[0], 'companyName') || getString(experiences[0], 'company') || '';
      }
      return '';
    })(),
    title: (() => {
      const experiences = getArray(apiResponse, 'experiences');
      if (experiences.length > 0) {
        return getString(experiences[0], 'title') || '';
      }
      return '';
    })(),
    location: (() => {
      const location = getLocation(apiResponse);
      if (location?.basicLocation) {
        return `${location.basicLocation.city || ''}, ${location.basicLocation.countryCode || ''}`;
      }
      return getString(apiResponse, 'locationName') || '';
    })(),
    linkedin_url: linkedinArtifactContent.profile_url,
    // profile_picture: profilePictureUrl, // TODO: Fix type compatibility - will sync via separate mechanism
    
    // Distill into professional context (a curated subset of LinkedIn data)
    professional_context: {
      // current_ventures might be better derived from multiple experiences or headline
      current_ventures: linkedinArtifactContent.headline, 
      background: {
        education: linkedinArtifactContent.education?.slice(0, 2).map(edu => 
          `${edu.school}${edu.degree ? ` (${edu.degree}${edu.field ? `, ${edu.field}` : ''})` : ''}`
        ),
        previous_companies: linkedinArtifactContent.experience?.slice(0, 4).map(exp => exp.company).filter(Boolean) as string[], // Take first few, filter out undefined/null
        expertise_areas: [], // This would likely come from skills or endorsements, not directly in basic profile.
        focus_areas: linkedinArtifactContent.about?.substring(0, 200) // A snippet from summary as focus area
      },
      // speaking_topics and achievements are not typically direct fields in basic LinkedIn scrapes, might need manual input or richer API.
      speaking_topics: [], 
      achievements: [], 
      goals: [], // Goals are not usually on a public LinkedIn profile
    } as Json, // Cast to Json for database compatibility
    
    // The linkedin_data field on the Contact record itself
    linkedin_data: linkedinArtifactContent as unknown as Json // Cast to Json for database compatibility
  };

  return { contactUpdates, linkedinArtifact };
}; 