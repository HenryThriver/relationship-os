import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UserProfileUpdate } from '@/types/userProfile';

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

        // Also ensure onboarding state exists
        const { error: onboardingError } = await supabase
          .from('onboarding_state')
          .insert({
            user_id: user.id,
            current_screen: 1,
            completed_screens: [],
            started_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
          })
          .select()
          .single();

        // Don't fail if onboarding state already exists
        if (onboardingError && onboardingError.code !== '23505') {
          console.warn('Warning: Could not create onboarding state:', onboardingError);
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
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Handle initial goal creation at category selection
    if (body.create_initial_goal) {
      const { goal_category } = body;

      // Create initial goal record with just category
      const { data: newGoal, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: `Goal: ${goal_category}`, // Temporary title, will be updated by AI
          description: 'Goal details will be added from voice memo analysis.',
          category: goal_category,
          created_from: 'onboarding',
          status: 'draft', // Draft until voice memo is processed
          is_primary: true
        })
        .select()
        .single();

      if (goalError) {
        console.error('Error creating initial goal:', goalError);
        return NextResponse.json({ error: 'Failed to create initial goal' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        goal: newGoal,
        message: 'Initial goal created successfully'
      });
    }
    
    // Handle updating an existing goal
    if (body.update_existing_goal) {
      const { goal_id, title, description } = body;

      if (!goal_id) {
        return NextResponse.json({ error: 'Goal ID is required for updates' }, { status: 400 });
      }

      // Update the existing goal record
      const { data: updatedGoal, error: goalUpdateError } = await supabase
        .from('goals')
        .update({
          title: title,
          description: description
        })
        .eq('id', goal_id)
        .eq('user_id', user.id) // Ensure user owns the goal
        .select()
        .single();

      if (goalUpdateError) {
        console.error('Error updating goal:', goalUpdateError);
        return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
      }

      // Also update the user profile to maintain consistency
      const { error: profileUpdateError } = await supabase
        .from('contacts')
        .update({
          primary_goal: title,
          goal_description: description
        })
        .eq('user_id', user.id)
        .eq('is_self_contact', true);

      if (profileUpdateError) {
        console.warn('Warning: Failed to update profile with goal changes:', profileUpdateError);
        // Don't fail the operation since the goal update succeeded
      }

      return NextResponse.json({ 
        success: true, 
        goal: updatedGoal,
        message: 'Goal updated successfully'
      });
    }
    
    // Handle associating contacts with existing goal
    if (body.associate_contacts_with_goal) {
      const { goal_id, imported_contacts } = body;

      if (!goal_id || !imported_contacts || imported_contacts.length === 0) {
        return NextResponse.json({ error: 'Goal ID and contacts are required' }, { status: 400 });
      }

      // Associate imported contacts with the goal
      const goalContactInserts = imported_contacts.map((contact: any) => ({
        user_id: user.id,
        goal_id: goal_id,
        contact_id: contact.id,
        relevance_score: 0.8, // High relevance since manually selected
        notes: `Added during onboarding for goal achievement`
      }));

      const { error: goalContactError } = await supabase
        .from('goal_contacts')
        .insert(goalContactInserts);

      if (goalContactError) {
        console.error('Error associating contacts with goal:', goalContactError);
        return NextResponse.json({ error: 'Failed to associate contacts with goal' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        contacts_associated: imported_contacts.length,
        message: 'Contacts associated with goal successfully'
      });
    }
    
    // Handle goal creation from onboarding
    if (body.create_goal_from_onboarding) {
      const { 
        goal_category, 
        voice_memo_id, 
        primary_goal, 
        goal_description,
        imported_contacts 
      } = body;

      // Create comprehensive goal record
      const { data: newGoal, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: primary_goal,
          description: goal_description,
          category: goal_category,
          voice_memo_id: voice_memo_id,
          created_from: 'onboarding',
          status: 'active',
          is_primary: true
        })
        .select()
        .single();

      if (goalError) {
        console.error('Error creating goal:', goalError);
        return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
      }

      // Associate imported contacts with the goal
      if (imported_contacts && imported_contacts.length > 0) {
        const goalContactInserts = imported_contacts.map((contact: any) => ({
          user_id: user.id,
          goal_id: newGoal.id,
          contact_id: contact.id,
          relevance_score: 0.8, // High relevance since manually selected
          notes: `Added during onboarding for goal: ${primary_goal}`
        }));

        const { error: goalContactError } = await supabase
          .from('goal_contacts')
          .insert(goalContactInserts);

        if (goalContactError) {
          console.error('Error associating contacts with goal:', goalContactError);
          // Don't fail the whole operation
        }
      }

      return NextResponse.json({ 
        success: true, 
        goal: newGoal,
        message: 'Goal created successfully from onboarding data'
      });
    }

    // Existing profile update logic
    const updates: Record<string, any> = {};

    // Handle profile updates
    if (body.primary_goal !== undefined) {
      updates.primary_goal = body.primary_goal;
    }
    if (body.goal_description !== undefined) {
      updates.goal_description = body.goal_description;
    }
    if (body.linkedin_url !== undefined) {
      updates.linkedin_url = body.linkedin_url;
    }

    // Update self-contact profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('contacts')
      .update(updates)
      .eq('user_id', user.id)
      .eq('is_self_contact', true)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: updatedProfile });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 