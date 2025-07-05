import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UserLinkedInAnalysisRequest, UserLinkedInAnalysisResponse } from '@/types/userProfile';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { linkedin_url }: UserLinkedInAnalysisRequest = await req.json();

    if (!linkedin_url) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    // Validate LinkedIn URL format
    const linkedinUrlPattern = /linkedin\.com\/in\/[^\/\?]+/;
    if (!linkedinUrlPattern.test(linkedin_url)) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn URL format. Expected format: linkedin.com/in/username' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get or create user's self-contact
    let { data: selfContact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_self_contact', true)
      .single();

    if (contactError && contactError.code !== 'PGRST116') {
      console.error('Error fetching self-contact:', contactError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    // Create self-contact if it doesn't exist
    if (!selfContact) {
      const { data: newSelfContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          name: user.user_metadata?.full_name || user.email || 'My Profile',
          email: user.email,
          linkedin_url: linkedin_url, // Set the LinkedIn URL
          is_self_contact: true,
          relationship_score: 6,
          profile_completion_score: 0,
          ways_to_help_others: [],
          introduction_opportunities: [],
          knowledge_to_share: [],
          networking_challenges: [],
          onboarding_voice_memo_ids: []
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating self-contact:', createError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }

      selfContact = newSelfContact;
    }

    // Update self-contact with LinkedIn URL
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ linkedin_url })
      .eq('id', selfContact.id);

    if (updateError) {
      console.error('Error updating LinkedIn URL:', updateError);
      return NextResponse.json(
        { error: 'Failed to update LinkedIn URL' },
        { status: 500 }
      );
    }

    // Use existing LinkedIn scraping infrastructure
    // Call the existing rescrape endpoint internally
    const rescrapeResponse = await fetch(`${req.nextUrl.origin}/api/linkedin/rescrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || '',
        'Cookie': req.headers.get('Cookie') || '',
      },
      body: JSON.stringify({
        contactId: selfContact.id,
        linkedinUrl: linkedin_url,
      }),
    });

    if (!rescrapeResponse.ok) {
      const errorData = await rescrapeResponse.json();
      console.error('LinkedIn scraping failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to analyze LinkedIn profile', details: errorData.error },
        { status: 500 }
      );
    }

    await rescrapeResponse.json();

    // The existing infrastructure will:
    // 1. Scrape LinkedIn profile data
    // 2. Create linkedin_profile artifact
    // 3. Trigger AI processing via parse-artifact
    // 4. AI will detect self-contact and use user-focused prompts
    // 5. Update user's profile with extracted insights

    // FIX: Also sync LinkedIn posts during onboarding (just like regular contacts)
    try {
      const postsResponse = await fetch(`${req.nextUrl.origin}/api/linkedin/sync-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || '',
          'Cookie': req.headers.get('Cookie') || '',
        },
        body: JSON.stringify({
          contactId: selfContact.id,
        }),
      });

      if (!postsResponse.ok) {
        console.warn('LinkedIn posts sync failed during onboarding:', await postsResponse.text());
        // Don't fail the whole process if posts sync fails
      }
    } catch (postsError) {
      console.warn('LinkedIn posts sync error during onboarding:', postsError);
      // Don't fail the whole process if posts sync fails
    }

    // Wait a moment for processing to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return success response
    const response: UserLinkedInAnalysisResponse = {
      success: true,
      analysis: {
        professional_interests: [], // Will be populated by AI processing
        expertise_areas: [],
        communication_style: '',
        ways_to_help_others: [],
        introduction_opportunities: [],
        knowledge_to_share: [],
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('LinkedIn analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 