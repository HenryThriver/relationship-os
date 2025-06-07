import type { RapidLinkedInPost, LinkedInPostArtifactContent } from '@/types/artifact';

export class LinkedInPostsService {
  private rapidApiKey: string;
  private rapidApiHost: string;

  constructor() {
    this.rapidApiKey = process.env.RAPIDAPI_KEY!;
    this.rapidApiHost = process.env.RAPIDAPI_LINKEDIN_HOST || 'linkedin-api8.p.rapidapi.com';
    
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
      const url = new URL(`https://${this.rapidApiHost}/get-profile-posts`);
      
      url.searchParams.append('username', username);
      url.searchParams.append('limit', limit.toString());
      
      if (startDate) {
        url.searchParams.append('start_date', startDate);
      }

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

      const data = await response.json();
      
      // Handle different response structures from RapidAPI
      if (data.posts && Array.isArray(data.posts)) {
        return data.posts;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        console.warn('Unexpected LinkedIn posts response structure:', data);
        return [];
      }

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
    const isAuthor = this.isContactAuthor(post.authorName, contactName);
    
    return {
      post_id: post.postId,
      author: post.authorName,
      is_author: isAuthor,
      post_type: this.normalizePostType(post.postType),
      content: post.postContent || '',
      media: post.media?.map(m => ({
        type: this.normalizeMediaType(m.type),
        url: m.url,
        title: m.title,
      })),
      engagement: {
        likes: post.likesCount || 0,
        comments: post.commentsCount || 0,
        shares: post.sharesCount || 0,
      },
      linkedin_url: post.postUrl,
      posted_at: post.publishedDate,
      hashtags: post.hashtags || [],
      mentions: post.mentions || [],
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
    if (post.postContent && post.postContent.toLowerCase().includes(contactName.toLowerCase())) {
      return 'mentioned_contact';
    }
    
    // Check mentions array
    if (post.mentions?.some(mention => 
      mention.toLowerCase().includes(contactName.toLowerCase())
    )) {
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
} 