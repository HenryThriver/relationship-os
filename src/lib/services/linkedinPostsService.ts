import type { RapidLinkedInPost, LinkedInPostArtifactContent, RapidLinkedInApiResponse } from '@/types/artifact';

export class LinkedInPostsService {
  private rapidApiKey: string;
  private rapidApiHost: string;

  constructor() {
    this.rapidApiKey = process.env.RAPIDAPI_KEY!;
    this.rapidApiHost = process.env.RAPIDAPI_HOST || 'linkedin-api8.p.rapidapi.com';
    
    if (!this.rapidApiKey) {
      throw new Error('RAPIDAPI_KEY is required for LinkedIn posts service');
    }
  }

  /**
   * Fetch posts from a LinkedIn profile
   */
  async fetchUserPosts(
    linkedinUrl: string, 
    limit: number = 300,
    startDate?: string
  ): Promise<RapidLinkedInPost[]> {
    try {
      const username = this.extractUsernameFromUrl(linkedinUrl);
      const allPosts: RapidLinkedInPost[] = [];
      let paginationToken: string | undefined;
      // const _cutoffDate = startDate ? new Date(startDate) : null;
      const batchSize = 50; // API returns ~50 posts per request
      let totalFetched = 0;

      console.log(`Starting LinkedIn posts fetch for ${username}, limit: ${limit}, startDate: ${startDate}`);

      while (totalFetched < limit) {
        const url = new URL(`https://${this.rapidApiHost}/get-profile-posts`);
        url.searchParams.append('username', username);
        url.searchParams.append('start', '0');
        url.searchParams.append('count', batchSize.toString());
        
        // Add unofficial postedAt date filter to get only recent posts
        if (startDate) {
          // Convert ISO date to the format expected by the API (YYYY-MM-DD HH:MM)
          const dateObj = new Date(startDate);
          const formattedDate = dateObj.toISOString().slice(0, 16).replace('T', ' ');
          url.searchParams.append('postedAt', formattedDate);
          console.log(`Using server-side date filter: postedAt=${formattedDate}`);
        }
        
        // Add pagination token if we have one
        if (paginationToken) {
          url.searchParams.append('paginationToken', paginationToken);
        }

        console.log(`Fetching batch ${Math.floor(totalFetched / batchSize) + 1} - Posts so far: ${totalFetched}`);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': this.rapidApiKey,
            'X-RapidAPI-Host': this.rapidApiHost,
          }
        });

        if (!response.ok) {
          throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
        }

        const apiResponse: RapidLinkedInApiResponse = await response.json();
        
        if (!apiResponse.success) {
          throw new Error(`LinkedIn API returned error: ${apiResponse.message || 'Unknown error'}`);
        }

        const batchPosts = apiResponse.data || [];
        console.log(`Received ${batchPosts.length} posts in this batch`);

        if (batchPosts.length === 0) {
          console.log('No more posts available, stopping pagination');
          break;
        }

        // Server-side date filtering via postedAt parameter eliminates need for client-side filtering
        // All returned posts should already be within our date range
        console.log(`Received ${batchPosts.length} posts from server (already date-filtered)`);
        
        // Add all posts from this batch (no duplicate detection in basic method)
        allPosts.push(...batchPosts);
        totalFetched += batchPosts.length;

        // Check if we have more pages
        paginationToken = apiResponse.paginationToken;
        if (!paginationToken) {
          console.log('No pagination token found, stopping pagination');
          break;
        }

        // If this batch had fewer posts than expected, we might be at the end
        if (batchPosts.length < batchSize) {
          console.log('Received incomplete batch, likely at end of posts');
          break;
        }

        // Add a small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`Pagination complete. Total posts fetched: ${allPosts.length}`);
      return allPosts;

    } catch (error) {
      console.error('Failed to fetch LinkedIn posts:', error);
      throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch user posts with duplicate detection to stop early when hitting existing posts
   */
  async fetchUserPostsWithDuplicateDetection(
    linkedinUrl: string, 
    limit: number = 300,
    startDate?: string,
    existingPostIds?: Set<string>
  ): Promise<RapidLinkedInPost[]> {
    try {
      const username = this.extractUsernameFromUrl(linkedinUrl);
      const allPosts: RapidLinkedInPost[] = [];
      let paginationToken: string | undefined;
      const batchSize = 25; // Reduced from 50 to be more API-friendly and make better progress
      let totalFetched = 0;
      let consecutiveDuplicateBatches = 0;
      let retryCount = 0;
      let batchNumber = 1; // Track actual batch attempts separately from posts fetched
      const maxConsecutiveDuplicates = 2; // Stop if we get 2 batches in a row with mostly duplicates

      console.log(`Starting LinkedIn posts fetch for ${username}, limit: ${limit}, startDate: ${startDate}`);
      console.log(`Existing posts to check against: ${existingPostIds?.size || 0}`);

      while (totalFetched < limit) {
        const url = new URL(`https://${this.rapidApiHost}/get-profile-posts`);
        url.searchParams.append('username', username);
        url.searchParams.append('start', '0');
        url.searchParams.append('count', batchSize.toString());
        
        // Add unofficial postedAt date filter to get only recent posts
        if (startDate) {
          // Convert ISO date to the format expected by the API (YYYY-MM-DD HH:MM)
          const dateObj = new Date(startDate);
          const formattedDate = dateObj.toISOString().slice(0, 16).replace('T', ' ');
          url.searchParams.append('postedAt', formattedDate);
          console.log(`Using server-side date filter: postedAt=${formattedDate}`);
        }
        
        // Add pagination token if we have one
        if (paginationToken) {
          url.searchParams.append('paginationToken', paginationToken);
        }

        console.log(`Fetching batch ${batchNumber} - Posts so far: ${totalFetched}`);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': this.rapidApiKey,
            'X-RapidAPI-Host': this.rapidApiHost,
          }
        });

        if (!response.ok) {
          // Handle rate limiting with exponential backoff
          if (response.status === 429) {
            const retryDelay = Math.min(5000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
            console.log(`Rate limited. Waiting ${retryDelay}ms before retrying...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryCount++;
            continue; // Retry the same batch
          }
          throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
        }

        // Reset retry count on successful request
        retryCount = 0;

        const apiResponse: RapidLinkedInApiResponse = await response.json();
        
        if (!apiResponse.success) {
          throw new Error(`LinkedIn API returned error: ${apiResponse.message || 'Unknown error'}`);
        }

        const batchPosts = apiResponse.data || [];
        console.log(`Received ${batchPosts.length} posts in this batch`);

        if (batchPosts.length === 0) {
          console.log('No more posts available, stopping pagination');
          break;
        }

        // Server-side date filtering via postedAt parameter eliminates need for client-side filtering
        // All returned posts should already be within our date range
        console.log(`Received ${batchPosts.length} posts from server (already date-filtered)`);
        
        // Check for duplicates if we have existing post IDs
        let newPosts = batchPosts;
        if (existingPostIds && existingPostIds.size > 0) {
          const beforeDuplicateFilter = newPosts.length;
          newPosts = batchPosts.filter(post => !existingPostIds.has(post.urn));
          const duplicatesInBatch = beforeDuplicateFilter - newPosts.length;
          
          console.log(`Duplicate filter: ${beforeDuplicateFilter} -> ${newPosts.length} posts (${duplicatesInBatch} duplicates found)`);
          
          // If more than 80% of the batch are duplicates, increment consecutive duplicate counter
          if (duplicatesInBatch / beforeDuplicateFilter > 0.8) {
            consecutiveDuplicateBatches++;
            console.log(`High duplicate batch detected (${consecutiveDuplicateBatches}/${maxConsecutiveDuplicates})`);
            
            // If we've hit too many consecutive duplicate batches, stop
            if (consecutiveDuplicateBatches >= maxConsecutiveDuplicates) {
              console.log(`Stopping pagination due to consecutive duplicate batches`);
              // Add the few new posts from this batch before stopping
              allPosts.push(...newPosts);
              break;
            }
          } else {
            // Reset counter if we have a batch with mostly new posts
            consecutiveDuplicateBatches = 0;
          }
        }

        allPosts.push(...newPosts);
        totalFetched += newPosts.length;
        
        // Increment batch number after successful processing
        batchNumber++;

        // Check if we have more pages
        paginationToken = apiResponse.paginationToken;
        if (!paginationToken) {
          console.log('No pagination token found, stopping pagination');
          break;
        }

        // If this batch had fewer posts than expected, we might be at the end
        if (batchPosts.length < batchSize) {
          console.log('Received incomplete batch, likely at end of posts');
          break;
        }

        // Add a small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased from 200ms to 1000ms
      }

      console.log(`Pagination complete. Total new posts fetched: ${allPosts.length}`);
      return allPosts;

    } catch (error) {
      console.error('Failed to fetch LinkedIn posts:', error);
      throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform RapidAPI post data to our artifact format
   */
  transformPostToArtifact(
    post: RapidLinkedInPost, 
    contactId: string,
    contactName: string
  ): LinkedInPostArtifactContent {
    const authorName = `${post.author.firstName} ${post.author.lastName}`;
    const isAuthor = this.isContactAuthor(authorName, contactName);
    
    // Extract hashtags from post text
    const hashtags = this.extractHashtags(post.text);
    
    // Transform mentions
    const mentions = post.mentions?.map(m => `${m.firstName} ${m.lastName}`) || [];
    
    // Handle media from article if present
    const media = post.article?.image?.map(img => ({
      type: 'image' as const,
      url: img.url,
      title: post.article?.title,
    })) || [];
    
    return {
      post_id: post.urn,
      author: authorName,
      is_author: isAuthor,
      post_type: this.normalizePostType(post.contentType),
      content: post.text || '',
      media: media.length > 0 ? media : undefined,
      engagement: {
        likes: post.likeCount || 0,
        comments: post.commentsCount || 0,
        shares: post.repostsCount || 0,
      },
      linkedin_url: post.postUrl,
      posted_at: this.normalizeTimestamp(post.postedDate, post.postedDateTimestamp),
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      mentions: mentions.length > 0 ? mentions : undefined,
      last_synced_at: new Date().toISOString(),
      
      // Set relevance reason based on contact relationship
      relevance_reason: isAuthor ? 'authored_by_contact' : this.determineRelevanceReason(post, contactName),
    };
  }

  /**
   * Generate content summary for timeline display
   */
  generateContentSummary(post: LinkedInPostArtifactContent): string {
    const maxLength = 120;
    let summary = post.content;
    
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength).trim() + '...';
    }
    
    // Add engagement info
    const engagement = post.engagement;
    const engagementText = `👍 ${engagement.likes} 💬 ${engagement.comments}`;
    
    // Add author context if not authored by contact
    const authorContext = post.is_author ? '' : ` • by ${post.author}`;
    
    return `${summary}\n${engagementText}${authorContext}`;
  }

  /**
   * Extract LinkedIn username from profile URL
   */
  private extractUsernameFromUrl(linkedinUrl: string): string {
    // Handle various LinkedIn URL formats
    const patterns = [
      /linkedin\.com\/in\/([^\/\?]+)/,
      /linkedin\.com\/pub\/([^\/\?]+)/,
      /linkedin\.com\/profile\/view\?id=([^&]+)/
    ];
    
    for (const pattern of patterns) {
      const match = linkedinUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    throw new Error('Invalid LinkedIn URL format. Expected format: linkedin.com/in/username');
  }

  /**
   * Normalize post type from RapidAPI to our standard types
   */
  private normalizePostType(type: string): 'original' | 'reshare' | 'article' {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('reshare') || lowerType.includes('share') || lowerType.includes('repost')) {
      return 'reshare';
    }
    
    if (lowerType.includes('article') || lowerType.includes('newsletter')) {
      return 'article';
    }
    
    return 'original';
  }

  /**
   * Normalize media type from RapidAPI to our standard types
   */
  private normalizeMediaType(type: string): 'image' | 'video' | 'article' | 'document' {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('video') || lowerType.includes('mp4')) {
      return 'video';
    }
    
    if (lowerType.includes('article') || lowerType.includes('link')) {
      return 'article';
    }
    
    if (lowerType.includes('document') || lowerType.includes('pdf') || lowerType.includes('doc')) {
      return 'document';
    }
    
    return 'image';
  }

  /**
   * Check if the contact is the author of the post
   */
  private isContactAuthor(authorName: string, contactName: string): boolean {
    if (!authorName || !contactName) return false;
    
    // Normalize names for comparison
    const normalizeString = (str: string) => 
      str.toLowerCase().trim().replace(/[^\w\s]/g, '');
    
    const normalizedAuthor = normalizeString(authorName);
    const normalizedContact = normalizeString(contactName);
    
    return normalizedAuthor === normalizedContact;
  }

  /**
   * Determine why this post is relevant to the contact
   */
  private determineRelevanceReason(
    post: RapidLinkedInPost, 
    contactName: string
  ): LinkedInPostArtifactContent['relevance_reason'] {
    // Check if contact is mentioned in content
    if (post.text && post.text.toLowerCase().includes(contactName.toLowerCase())) {
      return 'mentioned_contact';
    }
    
    // Check mentions array
    if (post.mentions?.some(mention => {
      const mentionName = `${mention.firstName} ${mention.lastName}`;
      return mentionName.toLowerCase().includes(contactName.toLowerCase());
    })) {
      return 'mentioned_contact';
    }
    
    // Default to topic relevance (could be enhanced with AI analysis)
    return 'topic_relevant';
  }

  /**
   * Extract hashtags from post content
   */
  extractHashtags(content: string): string[] {
    const hashtagPattern = /#[\w-]+/g;
    const matches = content.match(hashtagPattern);
    return matches || [];
  }

  /**
   * Extract mentions from post content  
   */
  extractMentions(content: string): string[] {
    const mentionPattern = /@[\w-]+/g;
    const matches = content.match(mentionPattern);
    return matches || [];
  }

  /**
   * Normalize timestamp from LinkedIn API to PostgreSQL-compatible format
   */
  private normalizeTimestamp(timestamp: string, timestampMs?: number): string {
    try {
      // If we have a Unix timestamp in milliseconds, use that (it's more reliable)
      if (timestampMs && typeof timestampMs === 'number') {
        return new Date(timestampMs).toISOString();
      }
      
      // Otherwise, parse the string timestamp
      // LinkedIn API returns: "2024-05-31 18:35:54.163 +0000 UTC"
      // PostgreSQL expects ISO format: "2024-05-31T18:35:54.163Z"
      
      // Remove " UTC" suffix and replace space with "T"
      let normalized = timestamp.replace(' UTC', '').replace(' ', 'T');
      
      // Ensure timezone is in ISO format (+0000 -> Z)
      normalized = normalized.replace(' +0000', 'Z');
      
      // Validate and parse the date to ensure it's valid
      const date = new Date(normalized);
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp from LinkedIn API:', timestamp);
        // Fallback to current timestamp
        return new Date().toISOString();
      }
      
      return date.toISOString();
    } catch (error) {
      console.error('Error normalizing timestamp:', timestamp, error);
      // Fallback to current timestamp
      return new Date().toISOString();
    }
  }
} 