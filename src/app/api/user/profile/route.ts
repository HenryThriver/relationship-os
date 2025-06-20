import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UserProfile, UserProfileUpdate } from '@/types/userProfile';

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's self-contact (profile)
    const { data: profile, error: profileError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_self_contact', true)
      .single();

    if (profileError) {
      // If no self-contact exists, create one
      if (profileError.code === 'PGRST116') {
        // Create self-contact manually
        const { data: createdProfile, error: createError } = await supabase
          .from('contacts')
          .insert({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email || 'My Profile',
            email: user.email,
            linkedin_url: '', // Required field
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

        return NextResponse.json({ profile: createdProfile });
      }

      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in GET /api/user/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const updates: UserProfileUpdate = await request.json();

    // Get user's self-contact ID
    const { data: existingProfile, error: fetchError } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_self_contact', true)
      .single();

    if (fetchError) {
      console.error('Error fetching user profile for update:', fetchError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingProfile.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      profile: updatedProfile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/user/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 