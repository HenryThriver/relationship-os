export interface LinkedInImportApiRequestBody {
  linkedinUrl: string;
}

interface LinkedInImage {
  url?: string;
  width?: number;
  height?: number;
}

interface LinkedInGeo {
  country?: string;
  city?: string;
  full?: string;
  countryCode?: string;
}

interface LinkedInLanguage {
  name?: string;
  proficiency?: string;
}

interface LinkedInDate {
  year?: number;
  month?: number;
  day?: number;
}

interface LinkedInSchoolOrCompany {
  name?: string;
  universalName?: string; // For companies from certifications
  logo?: string | LinkedInImage[]; // logo can be a string or array of images
  url?: string; // For schools
  schoolId?: string; // For schools
  companyId?: number | string; // For positions
  companyUsername?: string;
  companyURL?: string;
  companyLogo?: string;
  companyIndustry?: string;
  companyStaffCountRange?: string;
}

interface LinkedInEducation {
  start?: LinkedInDate;
  end?: LinkedInDate;
  fieldOfStudy?: string;
  degree?: string;
  grade?: string;
  schoolName?: string;
  description?: string;
  activities?: string;
  url?: string;
  schoolId?: string;
  logo?: LinkedInImage[]; 
}

interface LinkedInPosition {
  companyId?: number;
  companyName?: string;
  companyUsername?: string;
  companyURL?: string;
  companyLogo?: string;
  companyIndustry?: string;
  companyStaffCountRange?: string;
  title?: string;
  multiLocaleTitle?: { [key: string]: string };
  multiLocaleCompanyName?: { [key: string]: string };
  location?: string;
  locationType?: string;
  description?: string;
  employmentType?: string;
  start?: LinkedInDate;
  end?: LinkedInDate | null; // end can be null for current positions
}

interface LinkedInSkill {
  name?: string;
  passedSkillAssessment?: boolean;
  endorsementsCount?: number;
}

interface LinkedInCertification {
  name?: string;
  start?: LinkedInDate;
  end?: LinkedInDate | null;
  authority?: string;
  company?: LinkedInSchoolOrCompany;
  timePeriod?: { start?: LinkedInDate; end?: LinkedInDate | null }; // Seems redundant with top-level start/end
}

interface LinkedInProject { // Structure unknown from sample, basic placeholder
  [key: string]: any;
}

interface LinkedInVolunteering {
  title?: string;
  start?: LinkedInDate;
  end?: LinkedInDate | null;
  companyName?: string;
  CompanyId?: string; // Note the capitalization in sample
  companyUrl?: string;
  companyLogo?: string;
}

export interface RapidLinkedInProfile {
  // Top-level fields from your sample
  id?: number; // e.g., 13525872
  urn?: string; // e.g., "ACoAAADOY3AB4MHgRlpVHqMzycJQ5tcnWZH5j04"
  username?: string; // e.g., "henryfinkelstein" (public_identifier)
  firstName?: string;
  lastName?: string;
  isCreator?: boolean;
  isPremium?: boolean;
  profilePicture?: string; // Main profile picture URL
  profilePictures?: LinkedInImage[];
  backgroundImage?: LinkedInImage[];
  summary?: string;
  headline?: string;
  geo?: LinkedInGeo;
  languages?: LinkedInLanguage[];
  educations?: LinkedInEducation[];
  position?: LinkedInPosition[]; // Using "position" from sample for experiences
  fullPositions?: LinkedInPosition[]; // Also present in sample, seems similar to position
  skills?: LinkedInSkill[];
  certifications?: LinkedInCertification[];
  projects?: LinkedInProject; // Sample shows empty object {}
  volunteering?: LinkedInVolunteering[];
  supportedLocales?: Array<{ country?: string; language?: string }>;
  multiLocaleFirstName?: { [key: string]: string };
  multiLocaleLastName?: { [key: string]: string };
  multiLocaleHeadline?: { [key: string]: string };

  // Fields from previous placeholder that might still be relevant or named differently:
  // profile_url?: string; // Not in sample, must use input URL
  // public_identifier?: string; // Covered by username
  // full_name?: string; // Can be constructed from firstName, lastName
  // location?: string; // Covered by geo.full or geo.city + geo.country
  // country?: string; // Covered by geo.country
  // country_full_name?: string; // Covered by geo.country
  // city?: string; // Covered by geo.city
  // state?: string; // Not directly in geo, but geo.city might contain it
  // experiences?: LinkedInPosition[]; // Replaced by 'position'
}

export interface LinkedInImportApiResponse {
  success: boolean;
  data?: RapidLinkedInProfile;
  error?: string;
  rawResponse?: any; 
  inputLinkedinUrl?: string; // Add this to carry the original URL through the API response
} 