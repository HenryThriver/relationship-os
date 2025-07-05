import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';

interface VoiceAnalysisRequest {
  linkedin_url?: string;
  user_id?: string;
}

interface VoiceAnalysisResponse {
  howYouComeAcross: string;
  writingStyle: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<VoiceAnalysisResponse>> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', howYouComeAcross: '', writingStyle: '' },
        { status: 401 }
      );
    }

    await request.json();
    
    // Get user's LinkedIn profile data and recent posts
    const { data: profile, error: profileError } = await supabase
      .from('contacts')
      .select('id, linkedin_data, linkedin_url')
      .eq('user_id', user.id)
      .eq('is_self_contact', true)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found', howYouComeAcross: '', writingStyle: '' },
        { status: 404 }
      );
    }

    // Get recent LinkedIn posts
    const { data: posts, error: postsError } = await supabase
      .from('artifacts')
      .select('content, created_at')
      .eq('contact_id', profile.id)
      .eq('type', 'linkedin_post')
      .order('created_at', { ascending: false })
      .limit(10);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
    }

    // TODO: Call unified edge function for voice analysis
    // This should be integrated with the existing parse-artifact function
    // or create a specialized voice analysis function
    
    // For now, return placeholder data
    // TODO: Replace with actual AI analysis
    const mockAnalysis = {
      howYouComeAcross: "Professional and approachable, with a focus on building genuine relationships. You come across as someone who values collaboration and is passionate about helping others succeed in their careers.",
      writingStyle: "Your writing style is conversational yet professional. You tend to use personal anecdotes to illustrate points, ask engaging questions, and often include actionable insights. You write with authenticity and aren't afraid to show vulnerability when it adds value."
    };

    // TODO: Save analysis results to user profile
    // const { error: updateError } = await supabase
    //   .from('contacts')
    //   .update({
    //     voice_analysis: {
    //       howYouComeAcross: analysisResult.howYouComeAcross,
    //       writingStyle: analysisResult.writingStyle,
    //       analyzed_at: new Date().toISOString()
    //     }
    //   })
    //   .eq('id', profile.id);

    return NextResponse.json({
      success: true,
      ...mockAnalysis
    });

  } catch (error) {
    console.error('Voice analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        howYouComeAcross: '',
        writingStyle: ''
      },
      { status: 500 }
    );
  }
}

function createVoiceAnalysisPrompt(linkedinData: any, posts: any[]): string {
  return `
    Analyze the following LinkedIn profile and recent posts to determine:
    1. How this person comes across to others (their personal brand/presence)
    2. Their writing style and voice in professional communications

    LinkedIn Profile Data:
    ${JSON.stringify(linkedinData, null, 2)}

    Recent LinkedIn Posts:
    ${posts.map(post => post.content).join('\n\n---\n\n')}

    Please provide:
    1. "How You Come Across": A 2-3 sentence description of their professional presence and personal brand
    2. "Writing Style": A 2-3 sentence description of their communication style, tone, and approach

    Focus on:
    - Professional tone and personality
    - Communication patterns
    - How they engage with their audience
    - Their unique voice and perspective
    - What makes them memorable or distinctive

    Be specific and actionable - this will be used to help them create consistent content in the future.
  `;
} 