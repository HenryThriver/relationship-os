import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { LinkedInPostsService } from '@/lib/services/linkedinPostsService';
import type { RapidLinkedInProfile } from '@/types/rapidapi';
import { LinkedInProfileData } from '@/types/linkedin';

interface GoalContactRequest {
  linkedin_urls: string[];
  goal_id?: string;
  voice_memo_id?: string;
  include_email_sync?: boolean;
  email_address?: string;
  additional_emails?: string[];
}

interface EnrichedContact {
  id: string;
  name: string;
  linkedin_url: string;
  company?: string;
  title?: string;
  profile_picture?: string;
  headline?: string;
  recent_posts_count: number;
}

interface GoalContactResponse {
  success: boolean;
  contacts_created: number;
  contacts: EnrichedContact[];
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<GoalContactResponse>> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          }
        }
      }
    );
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, contacts_created: 0, contacts: [], error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: GoalContactRequest = await request.json();
    const { linkedin_urls, goal_id, voice_memo_id, email_address, additional_emails } = body;

    if (!linkedin_urls || !Array.isArray(linkedin_urls) || linkedin_urls.length === 0) {
      return NextResponse.json(
        { success: false, contacts_created: 0, contacts: [], error: 'LinkedIn URLs are required' },
        { status: 400 }
      );
    }

    // Get user's primary goal if no goal_id provided
    let targetGoalId = goal_id;
    if (!targetGoalId) {
      const { data: goals, error: goalError } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .limit(1);

      if (goalError) {
        console.error('Error fetching primary goal:', goalError);
        return NextResponse.json(
          { success: false, contacts_created: 0, contacts: [], error: 'Failed to find primary goal' },
          { status: 500 }
        );
      }

      targetGoalId = goals?.[0]?.id;
    }

    const createdContacts: EnrichedContact[] = [];

    // Initialize LinkedIn posts service
    const postsService = new LinkedInPostsService();

    // Process each LinkedIn URL
    for (const linkedinUrl of linkedin_urls) {
      try {
        // Check if contact already exists
        const { data: existingContact, error: checkError } = await supabase
          .from('contacts')
          .select('id, name, company, title, linkedin_data')
          .eq('user_id', user.id)
          .eq('linkedin_url', linkedinUrl)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing contact:', checkError);
          continue;
        }

        let contactId: string;
        let contactName: string;
        let contactCompany: string | undefined;
        let contactTitle: string | undefined;
        let profilePicture: string | undefined;
        let headline: string | undefined;
        let recentPostsCount = 0;

        if (existingContact) {
          // Contact already exists, use existing data
          contactId = existingContact.id;
          contactName = existingContact.name;
          contactCompany = existingContact.company;
          contactTitle = existingContact.title;
          
          // Extract profile picture and headline from existing linkedin_data
          const linkedinData = existingContact.linkedin_data as LinkedInProfileData;
          profilePicture = linkedinData?.profilePicture || linkedinData?.profile_picture;
          headline = linkedinData?.headline;
          
          // If we don't have LinkedIn data, try to fetch it
          if (!linkedinData || !profilePicture) {
            console.log(`Existing contact ${contactName} missing LinkedIn data, fetching...`);
            const linkedinProfile = await fetchLinkedInProfile(linkedinUrl);
            
            if (linkedinProfile) {
              // Update the existing contact with new LinkedIn data
              const realName = `${linkedinProfile.firstName || ''} ${linkedinProfile.lastName || ''}`.trim();
              const company = linkedinProfile?.position?.[0]?.companyName || 
                             linkedinProfile?.fullPositions?.[0]?.companyName;
              const title = linkedinProfile?.position?.[0]?.title || 
                           linkedinProfile?.fullPositions?.[0]?.title;

              profilePicture = linkedinProfile?.profilePicture;
              headline = linkedinProfile?.headline;

              // Update the contact in the database
              const { error: updateError } = await supabase
                .from('contacts')
                .update({
                  name: realName || contactName,
                  company: company || contactCompany,
                  title: title || contactTitle,
                  location: linkedinProfile?.geo?.full || linkedinProfile?.geo?.city,
                  linkedin_data: linkedinProfile,
                  profile_completion_score: 60
                })
                .eq('id', contactId);

              if (updateError) {
                console.error('Error updating existing contact with LinkedIn data:', updateError);
              } else {
                console.log(`Updated existing contact ${contactName} with LinkedIn data`);
                contactName = realName || contactName;
                contactCompany = company || contactCompany;
                contactTitle = title || contactTitle;
              }
            }
          }
        } else {
          // Contact doesn't exist, create new one
          
          // Fetch LinkedIn profile data
          const linkedinProfile = await fetchLinkedInProfile(linkedinUrl);
          
          // Extract name with proper Unicode handling
          const realName = linkedinProfile ? 
            `${linkedinProfile.firstName || ''} ${linkedinProfile.lastName || ''}`.trim() : 
            extractNameFromLinkedInUrl(linkedinUrl);
          
          const company = linkedinProfile?.position?.[0]?.companyName || 
                         linkedinProfile?.fullPositions?.[0]?.companyName;
          
          const title = linkedinProfile?.position?.[0]?.title || 
                       linkedinProfile?.fullPositions?.[0]?.title;

          profilePicture = linkedinProfile?.profilePicture;
          headline = linkedinProfile?.headline;

          // Prepare email addresses - combine primary and additional emails
          const allEmails: string[] = [];
          if (email_address?.trim()) {
            allEmails.push(email_address.trim());
          }
          if (additional_emails && Array.isArray(additional_emails)) {
            // Add additional emails, filtering out duplicates and empty strings
            const uniqueAdditionalEmails = additional_emails
              .map(e => e.trim())
              .filter(e => e && !allEmails.includes(e));
            allEmails.push(...uniqueAdditionalEmails);
          }

          const { data: newContact, error: createError } = await supabase
            .from('contacts')
            .insert({
              user_id: user.id,
              name: realName,
              linkedin_url: linkedinUrl,
              email: allEmails[0] || null, // Primary email in email field
              email_addresses: allEmails.length > 0 ? allEmails : [], // All emails in array
              company: company,
              title: title,
              location: linkedinProfile?.geo?.full || linkedinProfile?.geo?.city,
              is_self_contact: false,
              profile_completion_score: linkedinProfile ? 60 : 20, // Higher score if we have profile data
              relationship_score: 0,
              linkedin_data: linkedinProfile || null,
            })
            .select('id, name, company, title')
            .single();

          if (createError) {
            console.error('Error creating contact:', createError);
            continue;
          }

          contactId = newContact.id;
          contactName = newContact.name;
          contactCompany = newContact.company;
          contactTitle = newContact.title;

          console.log(`Created new contact ${realName} with emails:`, allEmails);

          // Create LinkedIn profile artifact for AI processing
          const { error: artifactError } = await supabase
            .from('artifacts')
            .insert({
              user_id: user.id,
              contact_id: contactId,
              type: 'linkedin_profile',
              content: linkedinProfile ? 
                `LinkedIn Profile for ${realName}${headline ? ` - ${headline}` : ''}` :
                `LinkedIn Profile: ${linkedinUrl}`,
              metadata: linkedinProfile ? {
                ...linkedinProfile,
                profile_url: linkedinUrl,
                source: 'goal_contact_import',
                processing_status: 'pending',
                scraped_at: new Date().toISOString()
              } : {
                profile_url: linkedinUrl,
                source: 'goal_contact_import',
                processing_status: 'pending'
              },
              timestamp: new Date().toISOString()
            })
            .select('id')
            .single();

          if (artifactError) {
            console.error('Error creating LinkedIn artifact:', artifactError);
          }
        }

        // Fetch recent posts and create artifacts (last 3 months)
        try {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          
          const recentPosts = await postsService.fetchUserPosts(
            linkedinUrl,
            50, // Limit to 50 posts for comprehensive analysis
            threeMonthsAgo.toISOString()
          );
          recentPostsCount = recentPosts.length;
          
          console.log(`Found ${recentPostsCount} recent posts for ${contactName}, creating artifacts...`);

          // Create individual artifacts for each LinkedIn post
          for (const post of recentPosts) {
            try {
              // Transform post to artifact content structure
              const postArtifactContent = postsService.transformPostToArtifact(post, contactId, contactName);
              
              // Create artifact in database
              const { data: postArtifact, error: postArtifactError } = await supabase
                .from('artifacts')
                .insert({
                  user_id: user.id,
                  contact_id: contactId,
                  type: 'linkedin_post',
                  content: `LinkedIn ${postArtifactContent.post_type} by ${postArtifactContent.author}`,
                  metadata: {
                    ...postArtifactContent,
                    source: 'goal_contact_import',
                    processing_status: 'pending',
                    imported_at: new Date().toISOString()
                  },
                  timestamp: postArtifactContent.posted_at
                })
                .select('id')
                .single();

              if (postArtifactError) {
                console.error(`Error creating LinkedIn post artifact for ${contactName}:`, postArtifactError);
              } else {
                console.log(`Created LinkedIn post artifact ${postArtifact.id} for ${contactName}`);
              }
            } catch (postError) {
              console.error(`Error processing post for ${contactName}:`, postError);
              continue; // Skip this post but continue with others
            }
          }
          
          console.log(`Successfully created ${recentPosts.length} LinkedIn post artifacts for ${contactName}`);
        } catch (postsError) {
          console.warn(`Could not fetch posts for ${linkedinUrl}:`, postsError);
          recentPostsCount = 0;
        }

        // Associate contact with goal if goal_id is provided
        if (targetGoalId) {
          const { error: goalContactError } = await supabase
            .from('goal_contacts')
            .upsert({
              user_id: user.id, // Required for RLS policy
              goal_id: targetGoalId,
              contact_id: contactId,
              // relationship_type: null (omitted - let user define later)
              relevance_score: 0.8, // High relevance since user manually selected
              notes: `Added during onboarding for goal achievement`
            })
            .select('id');

          if (goalContactError) {
            console.error('Error associating contact with goal:', goalContactError);
          }
        }

        // Associate voice memo with the contact if provided (for both new and existing contacts)
        if (voice_memo_id) {
          const { error: voiceMemoUpdateError } = await supabase
            .from('artifacts')
            .update({
              contact_id: contactId
            })
            .eq('id', voice_memo_id)
            .eq('user_id', user.id);

          if (voiceMemoUpdateError) {
            console.error('Error associating voice memo with contact:', voiceMemoUpdateError);
          } else {
            console.log(`Successfully associated voice memo ${voice_memo_id} with contact ${contactId}`);
          }
        }

        createdContacts.push({
          id: contactId,
          name: contactName,
          linkedin_url: linkedinUrl,
          company: contactCompany,
          title: contactTitle,
          profile_picture: profilePicture,
          headline: headline,
          recent_posts_count: recentPostsCount
        });

      } catch (error) {
        console.error(`Error processing LinkedIn URL ${linkedinUrl}:`, error);
        continue;
      }
    }

    // Update user profile with enriched contact data for confirmation screen
    await supabase
      .from('user_profiles')
      .update({
        goal_contact_urls: linkedin_urls,
        imported_goal_contacts: createdContacts
      })
      .eq('user_id', user.id);

    console.log('Goal contacts imported:', {
      user_id: user.id,
      goal_id: targetGoalId,
      contacts_count: createdContacts.length,
      urls: linkedin_urls
    });

    console.log('Enriched contacts created:', createdContacts);

    return NextResponse.json({
      success: true,
      contacts_created: createdContacts.length,
      contacts: createdContacts
    });

  } catch (error) {
    console.error('Error in goal contact import:', error);
    return NextResponse.json(
      { success: false, contacts_created: 0, contacts: [], error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function fetchLinkedInProfile(linkedinUrl: string): Promise<RapidLinkedInProfile | null> {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST || 'linkedin-api8.p.rapidapi.com';

    console.log(`Attempting to fetch LinkedIn profile for: ${linkedinUrl}`);
    console.log(`RapidAPI Key configured: ${!!rapidApiKey}`);
    console.log(`RapidAPI Host: ${rapidApiHost}`);

    if (!rapidApiKey) {
      console.warn('RapidAPI key not configured, skipping LinkedIn profile fetch');
      return null;
    }

    const url = new URL(`https://${rapidApiHost}/get-profile-data-by-url`);
    url.searchParams.append('url', linkedinUrl);

    console.log(`Making request to: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': rapidApiHost,
      }
    });

    console.log(`LinkedIn API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`LinkedIn profile fetch failed for ${linkedinUrl}: ${response.status} - ${errorText}`);
      return null;
    }

    const responseData = await response.json();
    console.log(`Raw LinkedIn API response:`, responseData);
    
    // Handle different response structures from RapidAPI
    let profile: RapidLinkedInProfile;
    if (responseData.data) {
      // If the response is wrapped in a data object
      profile = responseData.data;
    } else if (responseData.success && responseData.data) {
      // If it's a success wrapper
      profile = responseData.data;
    } else {
      // Direct response
      profile = responseData;
    }
    
    console.log(`Successfully fetched LinkedIn profile:`, {
      firstName: profile.firstName,
      lastName: profile.lastName,
      headline: profile.headline,
      profilePicture: profile.profilePicture,
      hasPosition: !!profile.position?.length,
      hasFullPositions: !!profile.fullPositions?.length
    });
    return profile;
  } catch (error) {
    console.warn(`Error fetching LinkedIn profile for ${linkedinUrl}:`, error);
    return null;
  }
}

function extractNameFromLinkedInUrl(url: string): string {
  try {
    const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (match) {
      let username = match[1];
      
      // Handle URL encoding
      try {
        username = decodeURIComponent(username);
      } catch {
        console.warn('Failed to decode username, using as-is:', username);
      }
      
      // Split by hyphens and capitalize each word
      const words = username.split('-').filter(word => word.length > 0);
      const capitalizedWords = words.map(word => {
        // Skip numbers and single characters
        if (word.length <= 1 || /^\d+$/.test(word)) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
      
      const result = capitalizedWords.join(' ');
      console.log(`Extracted name from URL ${url}: "${result}"`);
      return result;
    }
  } catch (error) {
    console.error('Error extracting name from LinkedIn URL:', error);
  }
  return 'LinkedIn Contact';
} 