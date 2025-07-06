import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LinkedInPostsService } from '@/lib/services/linkedinPostsService';
import type { RapidLinkedInPost } from '@/types/artifact';
import { Json } from '@/lib/supabase/database.types';

export async function POST(request: NextRequest) {
  let contactId: string | undefined;
  
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json();
    contactId = requestBody.contactId;
    
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
    
    // Calculate date range (6 months back for initial sync, 30 days back for incremental)
    // Reduced from 3 years to 6 months to avoid excessive API calls
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // For incremental syncs, only go back 30 days (duplicates will be filtered anyway)
    // For initial syncs, go back 6 months (more reasonable scope)
    const startDate = contact.linkedin_posts_last_sync_at 
      ? thirtyDaysAgo  // Incremental: 30 days back
      : sixMonthsAgo; // Initial: 6 months back (reduced from 3 years)

    // Update sync status to in_progress
    await supabase
      .from('contacts')
      .update({ linkedin_posts_sync_status: 'in_progress' })
      .eq('id', contactId);

    console.log(`Starting LinkedIn posts sync for contact ${contactId} (${contact.name})`);

    // Get existing post IDs to avoid duplicates
    const { data: existingArtifacts } = await supabase
      .from('artifacts')
      .select('metadata')
      .eq('contact_id', contactId)
      .eq('type', 'linkedin_post')
      .eq('user_id', user.id);

    const existingPostIds = new Set<string>(
      existingArtifacts?.map((a: { metadata: unknown }) => (a.metadata as Record<string, unknown>)?.post_id as string).filter(Boolean) || []
    );

    console.log(`Found ${existingPostIds.size} existing posts in database`);

    // Fetch posts with smart duplicate detection
    // Reduced limit from 300 to 100 to be more API-friendly
    const posts = await postsService.fetchUserPostsWithDuplicateDetection(
      contact.linkedin_url,
      100, // Reduced from 300 to avoid rate limiting
      startDate.toISOString(),
      existingPostIds
    );

    console.log(`Fetched ${posts.length} posts from LinkedIn API (after duplicate filtering)`);

    // Transform new posts (these should all be new since we filtered during fetch)
    const newPosts = posts
      .filter((post: RapidLinkedInPost) => post.urn) // Just ensure we have valid URNs
      .map((post: RapidLinkedInPost) => {
        const artifactContent = postsService.transformPostToArtifact(post, contactId!, contact?.name || '');
        const contentSummary = postsService.generateContentSummary(artifactContent);
        
        return {
          type: 'linkedin_post' as const,
          contact_id: contactId!, // Non-null assertion since we already validated contactId exists
          user_id: user.id,
          content: contentSummary,
          timestamp: artifactContent.posted_at,
          metadata: artifactContent, // Type cast needed for database insertion
          ai_parsing_status: 'pending' as const, // Will be processed by parse-artifact function
        };
      });

    console.log(`Prepared ${newPosts.length} new posts for insertion`);

    // Insert new posts in batches to avoid database limits
    const batchSize = 50;
    let insertedCount = 0;
    let batchNumber = 1;

    for (let i = 0; i < newPosts.length; i += batchSize) {
      const batch = newPosts.slice(i, i + batchSize);
      
      try {
        // Try batch insert first (fastest path for new posts)
        const { data: insertedData, error: insertError } = await supabase
          .from('artifacts')
          .insert(batch.map(post => ({
            ...post,
            metadata: post.metadata as unknown as Json
          })))
          .select('id');

        if (insertError) {
          // If it's a duplicate key error, handle gracefully
          if (insertError.code === '23505') {
            console.log(`Batch ${batchNumber} has duplicates, trying individual inserts...`);
            // Fall back to individual inserts for this batch
            let batchInsertedCount = 0;
            for (const post of batch) {
              try {
                const { data: singleInsert } = await supabase
                  .from('artifacts')
                  .insert([{
                    ...post,
                    metadata: post.metadata as unknown as Json
                  }])
                  .select('id');
                
                if (singleInsert && singleInsert.length > 0) {
                  batchInsertedCount++;
                }
              } catch (singleError: unknown) {
                // Skip duplicates silently
                if (singleError && typeof singleError === 'object' && 'code' in singleError && singleError.code !== '23505') {
                  console.error('Error inserting single post:', singleError);
                }
              }
            }
            insertedCount += batchInsertedCount;
            console.log(`Batch ${batchNumber}, new posts: ${batchInsertedCount}, total: ${insertedCount}`);
          } else {
            // For other errors, throw
            throw insertError;
          }
        } else {
          // Successful batch insert
          const actualInserted = insertedData?.length || 0;
          insertedCount += actualInserted;
          console.log(`Batch ${batchNumber}, new posts: ${actualInserted}, total: ${insertedCount}`);
        }
      } catch (error) {
        console.error(`Error inserting batch ${batchNumber}:`, error);
        throw error;
      }
      
      batchNumber++;
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
    
    // Try to reset sync status to allow retry
    try {
      if (contactId) {
        const supabase = await createClient();
        await supabase
          .from('contacts')
          .update({ 
            linkedin_posts_sync_status: 'failed',
            linkedin_posts_last_sync_at: new Date().toISOString()
          })
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