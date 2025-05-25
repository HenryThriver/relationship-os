export interface LinkedInImportApiRequestBody {
  linkedinUrl: string;
}

// This is a placeholder. You'll need to define this interface
// more accurately based on the actual JSON response structure
// from the RapidAPI linkedin-api8.p.rapidapi.com endpoint.
export interface RapidLinkedInProfile {
  profile_url?: string;
  public_identifier?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  headline?: string;
  location?: string;
  summary?: string; // Often the "About" section
  country?: string;
  country_full_name?: string;
  city?: string;
  state?: string;
  experiences?: Array<{
    company?: string;
    company_linkedin_profile_url?: string;
    title?: string;
    starts_at?: { day?: number; month?: number; year?: number };
    ends_at?: { day?: number; month?: number; year?: number } | null;
    description?: string;
    location?: string;
  }>;
  education?: Array<any>; // Define more accurately if needed
  skills?: string[];
  // Add other fields as you discover them from the API response
  // For example: recommendations, languages, projects, etc.
}

// Interface for the data returned by our /api/linkedin/import route
export interface LinkedInImportApiResponse {
  success: boolean;
  data?: RapidLinkedInProfile;
  error?: string;
  rawResponse?: any; // To store the full JSON from RapidAPI for artifact creation
} 