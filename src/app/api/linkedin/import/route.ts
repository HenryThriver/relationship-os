import { NextRequest, NextResponse } from 'next/server';
import type { LinkedInImportApiRequestBody, RapidLinkedInProfile, LinkedInImportApiResponse } from '@/types/rapidapi';

const RAPIDAPI_PROFILE_ENDPOINT = 'https://linkedin-api8.p.rapidapi.com/get-profile-data-by-url';

export async function POST(req: NextRequest): Promise<NextResponse<LinkedInImportApiResponse>> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST;

  if (!rapidApiKey || !rapidApiHost) {
    console.error('RapidAPI Key or Host not configured in environment variables.');
    return NextResponse.json(
      { success: false, error: 'Server configuration error: API credentials missing.' }, 
      { status: 500 }
    );
  }

  let requestBody: LinkedInImportApiRequestBody;
  try {
    requestBody = await req.json();
  } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const { linkedinUrl } = requestBody;

  if (!linkedinUrl) {
    return NextResponse.json({ success: false, error: 'LinkedIn URL is required.' }, { status: 400 });
  }

  // Basic URL validation (can be improved with a regex or library)
  if (!linkedinUrl.includes('linkedin.com/in/')) {
    return NextResponse.json({ success: false, error: 'Invalid LinkedIn profile URL format.' }, { status: 400 });
  }

  const options = {
    method: 'GET', // The RapidAPI example uses GET, even if we pass params. Confirmed: example shows GET with query params.
    headers: {
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': rapidApiHost
    }
  };

  // Construct the URL with query parameters for a GET request
  const urlWithParams = new URL(RAPIDAPI_PROFILE_ENDPOINT);
  urlWithParams.searchParams.append('url', linkedinUrl);
  // Add other parameters like 'use_cache' or 'refresh_cache' if needed, as per RapidAPI docs for this endpoint.
  // e.g., urlWithParams.searchParams.append('use_cache', 'true');

  try {
    const response = await fetch(urlWithParams.toString(), options);
    const responseText = await response.text(); // Read as text first to handle potential non-JSON errors

    if (!response.ok) {
      console.error(`RapidAPI error: ${response.status} ${response.statusText}`, responseText);
      // Attempt to parse error from RapidAPI if it's JSON, otherwise use statusText
      let apiError = response.statusText;
      try {
        const errorJson = JSON.parse(responseText);
        apiError = errorJson.message || errorJson.error || response.statusText;
      } catch (e) { /* Ignore parsing error, use statusText */ } // eslint-disable-line @typescript-eslint/no-unused-vars
      
      return NextResponse.json(
        { success: false, error: `Failed to fetch data from LinkedIn API: ${apiError}`, rawResponse: responseText, inputLinkedinUrl: linkedinUrl }, 
        { status: response.status }
      );
    }

    const data: RapidLinkedInProfile = JSON.parse(responseText);
    
    // You might want to validate the structure of 'data' here against RapidLinkedInProfile type
    // or parts of it before returning.

    return NextResponse.json({ success: true, data: data, rawResponse: data, inputLinkedinUrl: linkedinUrl }, { status: 200 });

  } catch (error: unknown) { // Changed error: any to error: unknown
    console.error('Error calling RapidAPI or processing response:', error);
    // It's important to pass linkedinUrl here as well if the catch block is reached after it's defined.
    // If the error occurs before linkedinUrl is extracted from the body, it will be undefined.
    const parsedRequestBody = await req.json().catch(() => ({linkedinUrl: undefined})); // Safely try to parse body again or default
    const originalUrl = parsedRequestBody.linkedinUrl || (typeof linkedinUrl !== 'undefined' ? linkedinUrl : undefined);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { success: false, error: message, inputLinkedinUrl: originalUrl }, 
      { status: 500 }
    );
  }
} 