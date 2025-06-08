'use server'; // Ensure this runs on the server

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Server-side Supabase client
import type { RapidLinkedInProfile, LinkedInImportApiResponse, LinkedInDate as RapidLinkedInDate } from '@/types/rapidapi';
import type { LinkedInArtifactContent } from '@/types/artifact';

const RAPIDAPI_PROFILE_ENDPOINT = 'https://linkedin-api8.p.rapidapi.com/get-profile-data-by-url';

interface LinkedInRescrapeRequestBody {
  contactId: string;
  linkedinUrl: string;
}

// Helper function to format LinkedInDate (from RapidAPI types) to a string
const formatDate = (date?: RapidLinkedInDate): string | undefined => {
  if (!date || date.year === undefined) return undefined;
  // Format as MM/YYYY or YYYY
  if (date.month && date.year) {
    return `${date.month.toString().padStart(2, '0')}/${date.year}`;
  }
  return date.year.toString();
};

const formatDuration = (start?: RapidLinkedInDate, end?: RapidLinkedInDate | null): string | undefined => {
  const startDateStr = formatDate(start);
  const endDateStr = end === null ? 'Present' : formatDate(end);

  if (startDateStr && endDateStr) return `${startDateStr} - ${endDateStr}`;
  if (startDateStr) return startDateStr;
  return undefined;
};

export async function POST(req: NextRequest): Promise<NextResponse<LinkedInImportApiResponse>> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST;
  const supabase = await createClient();

  if (!rapidApiKey || !rapidApiHost) {
    console.error('RapidAPI Key or Host not configured in environment variables.');
    return NextResponse.json(
      { success: false, error: 'Server configuration error: API credentials missing.' }, 
      { status: 500 }
    );
  }

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'User not authenticated.' }, { status: 401 });
  }

  // 2. Parse request body
  let requestBody: LinkedInRescrapeRequestBody;
  try {
    requestBody = await req.json();
  } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const { contactId, linkedinUrl } = requestBody;

  if (!contactId || !linkedinUrl) {
    return NextResponse.json({ success: false, error: 'Contact ID and LinkedIn URL are required.' }, { status: 400 });
  }

  if (!linkedinUrl.includes('linkedin.com/in/')) {
    return NextResponse.json({ success: false, error: 'Invalid LinkedIn profile URL format.' }, { status: 400 });
  }

  try {
    // 3. Verify contact ownership
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (contactError || !contact) {
      console.error('Error fetching contact or contact not found/user mismatch:', contactError);
      return NextResponse.json({ success: false, error: 'Contact not found or access denied.' }, { status: 404 });
    }

    // 4. Call RapidAPI to fetch LinkedIn profile data
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': rapidApiHost
      }
    };
    const urlWithParams = new URL(RAPIDAPI_PROFILE_ENDPOINT);
    urlWithParams.searchParams.append('url', linkedinUrl);
    // For rescraping, we might want to force a cache refresh if the API supports it
    // urlWithParams.searchParams.append('refresh_cache', 'true'); // Check RapidAPI docs for this specific endpoint

    const rapidApiResponse = await fetch(urlWithParams.toString(), options);
    const responseText = await rapidApiResponse.text();

    if (!rapidApiResponse.ok) {
      let apiError = rapidApiResponse.statusText;
      try {
        const errorJson = JSON.parse(responseText);
        apiError = errorJson.message || errorJson.error || rapidApiResponse.statusText;
      } catch (_e) { /* Ignore */ } // eslint-disable-line @typescript-eslint/no-unused-vars
      return NextResponse.json(
        { success: false, error: `Failed to fetch data from LinkedIn API: ${apiError}`, rawResponse: responseText, inputLinkedinUrl: linkedinUrl }, 
        { status: rapidApiResponse.status }
      );
    }

    const scrapedData: RapidLinkedInProfile = JSON.parse(responseText);

    const currentCompanyFromExperience = scrapedData.position?.[0]?.companyName || undefined;

    // 5. Transform scraped data into LinkedInArtifactContent format
    // This mapping should align with what LinkedInProfileModal expects and your types
    const artifactMetadata: LinkedInArtifactContent = {
      profile_url: linkedinUrl,
      headline: scrapedData.headline,
      about: scrapedData.summary,
      experience: scrapedData.position?.map(p => ({
        company: p.companyName || 'N/A',
        title: p.title || 'N/A',
        duration: formatDuration(p.start, p.end),
        description: p.description,
        companyName: p.companyName,
        date1: formatDate(p.start),
        date2: p.end === null ? 'Present' : formatDate(p.end),
      })),
      education: scrapedData.educations?.map(e => ({
        school: e.schoolName || 'N/A',
        degree: e.degree,
        field: e.fieldOfStudy,
        years: formatDuration(e.start, e.end),
        schoolName: e.schoolName,
        degreeName: e.degree,
        date1: formatDate(e.start),
        date2: formatDate(e.end),
      })),
      scraped_at: new Date().toISOString(),
      firstName: scrapedData.firstName,
      lastName: scrapedData.lastName,
      name: `${scrapedData.firstName || ''} ${scrapedData.lastName || ''}`.trim() || undefined,
      profilePicture: scrapedData.profilePicture,
      skills: scrapedData.skills?.map(s => ({ name: s.name || 'Unnamed Skill' })).filter(s => s.name !== 'Unnamed Skill'),
      geo: scrapedData.geo ? { 
        city: scrapedData.geo.city,
        country: scrapedData.geo.country,
        full: scrapedData.geo.full,
      } : undefined,
      company: currentCompanyFromExperience,
      location: scrapedData.geo?.full,
    };

    // --- DEBUG LOG before insert ---
    // Debug: artifactMetadata object being inserted
    // --- END DEBUG LOG ---

    // 6. Create a NEW artifact record
    const { data: newArtifact, error: insertError } = await supabase
      .from('artifacts')
      .insert({
        contact_id: contactId,
        user_id: user.id,
        type: 'linkedin_profile', // Ensure this type is in your artifact_type_enum
        content: `LinkedIn profile for ${artifactMetadata.name || 'contact'} updated on ${new Date().toLocaleDateString()}.`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: artifactMetadata as any, // Cast to any if Json type has issues with deep objects
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting new LinkedIn artifact:', insertError);
      return NextResponse.json({ success: false, error: `Database error: ${insertError.message}` }, { status: 500 });
    }

    // TODO: Optionally update contact fields if profile data changed (e.g., contact.linkedin_data)
    // This would involve fetching the contact, comparing data, and updating if necessary.

    return NextResponse.json({ 
      success: true, 
      message: 'LinkedIn profile re-scraped and new artifact created.', 
      data: scrapedData, // Return the raw scraped data as per existing API
      artifact: newArtifact, // Optionally return the new artifact details
      inputLinkedinUrl: linkedinUrl 
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error in LinkedIn rescrape route:', error);
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred';
    return NextResponse.json(
      { success: false, error: message, inputLinkedinUrl: linkedinUrl }, 
      { status: 500 }
    );
  }
} 