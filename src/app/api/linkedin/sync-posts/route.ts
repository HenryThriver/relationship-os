import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LinkedInPostsService } from '@/lib/services/linkedinPostsService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contactId } = await request.json();
    
    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });
    }

    // Fetch contact with LinkedIn URL
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, name, linkedin_url, linkedin_posts_last_sync_at, linkedin_posts_sync_status')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (!contact.linkedin_url) {
      return NextResponse.json({ 
        error: 'No LinkedIn URL found for this contact',
        success: false 
      }, { status: 400 });
    }

    // Check if already syncing
    if (contact.linkedin_posts_sync_status === 'in_progress') {
      return NextResponse.json({ 
        error: 'Sync already in progress for this contact',
        success: false 
      }, { status: 409 });
    }

    const postsService = new LinkedInPostsService();
    
    // Calculate date range (3 years back or since last sync)
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    
    const startDate = contact.linkedin_posts_last_sync_at 
      ? new Date(contact.linkedin_posts_last_sync_at)
      : threeYearsAgo;

    // Update sync status to in_progress
    await supabase
      .from('contacts')
      .update({ linkedin_posts_sync_status: 'in_progress' })
      .eq('id', contactId);

    console.log(`Starting LinkedIn posts sync for contact ${contactId} (${contact.name})`);

    // Fetch posts from LinkedIn API
    const posts = await postsService.fetchUserPosts(
      contact.linkedin_url,
      300, // Limit to 300 posts
      startDate.toISOString()
    );

    console.log(`Fetched ${posts.length} posts from LinkedIn API`);

    // Get existing post IDs to avoid duplicates
    const { data: existingArtifacts } = await supabase
      .from('artifacts')
      .select('metadata')
      .eq('contact_id', contactId)
      .eq('type', 'linkedin_post')
      .eq('user_id', user.id);

    const existingPostIds = new Set(
      existingArtifacts?.map(a => a.metadata?.post_id).filter(Boolean) || []
    );

    console.log(`Found ${existingPostIds.size} existing posts in database`);

    // Transform and filter new posts
    const newPosts = posts
      .filter(post => post.postId && !existingPostIds.has(post.postId))
      .map(post => {
        const artifactContent = postsService.transformPostToArtifact(post, contactId, contact.name);
        const contentSummary = postsService.generateContentSummary(artifactContent);
        
        return {
          type: 'linkedin_post',
          contact_id: contactId,
          user_id: user.id,
          content: contentSummary,
          timestamp: post.publishedDate,
          metadata: artifactContent,
          ai_parsing_status: 'pending', // Will be processed by parse-artifact function
        };
      });

    console.log(`Prepared ${newPosts.length} new posts for insertion`);

    // Insert new posts in batches to avoid database limits
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < newPosts.length; i += batchSize) {
      const batch = newPosts.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('artifacts')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        throw insertError;
      }
      
      insertedCount += batch.length;
      console.log(`Inserted batch ${Math.ceil((i + 1) / batchSize)}, total: ${insertedCount}`);
    }

    // Update sync completion
    await supabase
      .from('contacts')
      .update({
        linkedin_posts_last_sync_at: new Date().toISOString(),
        linkedin_posts_sync_status: 'completed'
      })
      .eq('id', contactId);

    console.log(`LinkedIn posts sync completed for contact ${contactId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${insertedCount} new LinkedIn posts`,
      newPostsCount: insertedCount,
      totalPostsFound: posts.length,
      syncStartDate: startDate.toISOString(),
    });

  } catch (error) {
    console.error('LinkedIn posts sync error:', error);
    
    // Update sync status to failed if we have contactId
    try {
      const { contactId } = await request.json().catch(() => ({}));
      if (contactId) {
        const supabase = await createClient();
        await supabase
          .from('contacts')
          .update({ linkedin_posts_sync_status: 'failed' })
          .eq('id', contactId);
      }
    } catch (statusUpdateError) {
      console.error('Failed to update sync status:', statusUpdateError);
    }

    // Determine appropriate error response based on error type
    let errorMessage = 'Failed to sync LinkedIn posts';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Invalid LinkedIn URL')) {
        errorMessage = error.message;
        statusCode = 400;
      } else if (error.message.includes('LinkedIn API error')) {
        errorMessage = 'LinkedIn API temporarily unavailable. Please try again later.';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: statusCode }
    );
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    
    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });
    }

    // Get sync status and recent posts count
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('linkedin_posts_last_sync_at, linkedin_posts_sync_status')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Get count of LinkedIn posts for this contact
    const { count: postsCount, error: countError } = await supabase
      .from('artifacts')
      .select('*', { count: 'exact' })
      .eq('contact_id', contactId)
      .eq('type', 'linkedin_post')
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting posts:', countError);
    }

    return NextResponse.json({
      success: true,
      lastSyncAt: contact.linkedin_posts_last_sync_at,
      syncStatus: contact.linkedin_posts_sync_status,
      postsCount: postsCount || 0,
    });

  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status', success: false },
      { status: 500 }
    );
  }
} 