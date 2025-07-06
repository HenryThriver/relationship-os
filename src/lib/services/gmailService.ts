import { createClient } from '@supabase/supabase-js';
import { decodeBase64ToUtf8, cleanEmailText } from '@/lib/utils/textDecoding';
import type { 
  GmailMessage, 
  GmailThread, 
  GmailLabel,
  GmailProfile,
  EmailImportRequest,
  EmailArtifactContent,
  UserTokens,
  GmailSyncState,
  EmailParticipant,
  GmailAttachment,
  EmailSyncProgress
} from '@/types/email';

// Gmail API configuration
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email'
];

export class GmailService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  /**
   * Get OAuth authorization URL for Gmail access
   */
  getAuthUrl(redirectUri: string, source: string = 'dashboard'): string {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope: REQUIRED_SCOPES.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: source // Pass source as state parameter
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens (server-side version)
   */
  async exchangeCodeForTokensServer(code: string, redirectUri: string, userId: string): Promise<UserTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
    }

    const data = await response.json();
    
    const expiryDate = new Date(Date.now() + (data.expires_in * 1000)).toISOString();

    // Use service role key for server-side operations
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tokenRecord, error } = await supabaseServer
      .from('user_tokens')
      .upsert({
        user_id: userId,
        gmail_access_token: data.access_token,
        gmail_refresh_token: data.refresh_token,
        gmail_token_expiry: expiryDate,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return tokenRecord;
  }

  /**
   * Exchange authorization code for tokens (client-side version)
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<UserTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store tokens in database
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const expiryDate = new Date(Date.now() + (data.expires_in * 1000)).toISOString();

    const { data: tokenRecord, error } = await this.supabase
      .from('user_tokens')
      .upsert({
        user_id: user.id,
        gmail_access_token: data.access_token,
        gmail_refresh_token: data.refresh_token,
        gmail_token_expiry: expiryDate,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return tokenRecord;
  }

  /**
   * Get current user's Gmail access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: tokenRecord, error } = await this.supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !tokenRecord?.gmail_access_token) {
      throw new Error('Gmail not connected. Please connect your Gmail account first.');
    }

    // Check if token is expired
    const expiryTime = new Date(tokenRecord.gmail_token_expiry || 0).getTime();
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

    if (expiryTime <= now + bufferTime) {
      // Token is expired or about to expire, refresh it
      return await this.refreshToken(tokenRecord);
    }

    return tokenRecord.gmail_access_token;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshToken(tokenRecord: UserTokens): Promise<string> {
    if (!tokenRecord.gmail_refresh_token) {
      throw new Error('No refresh token available. Please reconnect Gmail.');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: tokenRecord.gmail_refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data = await response.json();
    const expiryDate = new Date(Date.now() + (data.expires_in * 1000)).toISOString();

    // Update stored token
    const { error } = await this.supabase
      .from('user_tokens')
      .update({
        gmail_access_token: data.access_token,
        gmail_token_expiry: expiryDate,
        // Keep existing refresh token if new one not provided
        ...(data.refresh_token && { gmail_refresh_token: data.refresh_token }),
      })
      .eq('id', tokenRecord.id);

    if (error) throw error;

    return data.access_token;
  }

  /**
   * Make authenticated Gmail API request
   */
  private async gmailApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(`${GMAIL_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get Gmail profile information (server-side version)
   */
  async getProfileServer(userId: string): Promise<GmailProfile> {
    // Use service role key for server-side operations
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tokenRecord, error } = await supabaseServer
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !tokenRecord?.gmail_access_token) {
      throw new Error('Gmail not connected. Please connect your Gmail account first.');
    }

    // Check if token needs refresh
    let accessToken = tokenRecord.gmail_access_token;
    const tokenExpiry = tokenRecord.gmail_token_expiry ? new Date(tokenRecord.gmail_token_expiry) : null;
    const now = new Date();

    if (tokenExpiry && now >= tokenExpiry) {
      console.log('📧 Gmail token expired for profile, refreshing...');
      
      // Refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenRecord.gmail_refresh_token!,
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh Gmail token. Please reconnect your Gmail account.');
      }

      const refreshData = await refreshResponse.json();
      
      // Update token in database
      const newExpiry = new Date(Date.now() + (refreshData.expires_in * 1000));
      await supabaseServer
        .from('user_tokens')
        .update({
          gmail_access_token: refreshData.access_token,
          gmail_token_expiry: newExpiry.toISOString(),
        })
        .eq('user_id', userId);

      accessToken = refreshData.access_token;
      console.log('📧 Gmail token refreshed successfully for profile');
    }

    // Make direct API call with token
    const response = await fetch(`${GMAIL_API_BASE}/users/me/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get Gmail profile information (client-side version)
   */
  async getProfile(): Promise<GmailProfile> {
    return await this.gmailApiRequest<GmailProfile>('/users/me/profile');
  }

  /**
   * Get Gmail labels
   */
  async getLabels(): Promise<GmailLabel[]> {
    const response = await this.gmailApiRequest<{ labels: GmailLabel[] }>('/users/me/labels');
    return response.labels || [];
  }

  /**
   * Search for messages with query
   */
  async searchMessages(query: string, maxResults: number = 100, pageToken?: string): Promise<{
    messages: { id: string; threadId: string }[];
    nextPageToken?: string;
  }> {
    const params = new URLSearchParams({
      q: query,
      maxResults: maxResults.toString(),
      ...(pageToken && { pageToken }),
    });

    return await this.gmailApiRequest(`/users/me/messages?${params.toString()}`);
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string): Promise<GmailMessage> {
    return await this.gmailApiRequest<GmailMessage>(`/users/me/messages/${messageId}`);
  }

  /**
   * Get a thread by ID
   */
  async getThread(threadId: string): Promise<GmailThread> {
    return await this.gmailApiRequest<GmailThread>(`/users/me/threads/${threadId}`);
  }

  /**
   * Get attachment data
   */
  async getAttachment(messageId: string, attachmentId: string): Promise<Blob> {
    const response = await this.gmailApiRequest<{ data: string }>(
      `/users/me/messages/${messageId}/attachments/${attachmentId}`
    );

    // Decode base64url data
    const binaryString = atob(response.data.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes]);
  }

  /**
   * Parse email headers to extract participants
   */
  private parseEmailHeaders(headers: Array<{ name: string; value: string }>): {
    from: EmailParticipant;
    to: EmailParticipant[];
    cc: EmailParticipant[];
    bcc: EmailParticipant[];
    subject: string;
    date: string;
    messageId: string;
    inReplyTo?: string;
    references?: string[];
  } {
    const headerMap = new Map(headers.map(h => [h.name.toLowerCase(), h.value]));

    const parseParticipants = (headerValue?: string): EmailParticipant[] => {
      if (!headerValue) return [];
      
      // Basic email parsing - can be enhanced for complex cases
      return headerValue.split(',').map(email => {
        const match = email.trim().match(/^(.+?)\s*<(.+?)>$|^(.+)$/);
        if (match) {
          if (match[1] && match[2]) {
            return { name: match[1].trim(), email: match[2].trim() };
          } else {
            return { email: (match[3] || match[0]).trim() };
          }
        }
        return { email: email.trim() };
      });
    };

    const from = parseParticipants(headerMap.get('from'))[0] || { email: 'unknown@unknown.com' };
    const to = parseParticipants(headerMap.get('to'));
    const cc = parseParticipants(headerMap.get('cc'));
    const bcc = parseParticipants(headerMap.get('bcc'));

    return {
      from,
      to,
      cc,
      bcc,
      subject: headerMap.get('subject') || '',
      date: headerMap.get('date') || new Date().toISOString(),
      messageId: headerMap.get('message-id') || '',
      inReplyTo: headerMap.get('in-reply-to'),
      references: headerMap.get('references')?.split(/\s+/) || [],
    };
  }

  /**
   * Extract text content from Gmail message payload with proper UTF-8 decoding
   */
  private extractTextContent(payload: Record<string, unknown>): { text: string; html: string } {
    let text = '';
    let html = '';

    const extractFromPart = (part: unknown) => {
      if (
        part &&
        typeof part === 'object' &&
        'mimeType' in part &&
        ((part as Record<string, unknown>).mimeType === 'text/plain' || (part as Record<string, unknown>).mimeType === 'text/html') &&
        'body' in part &&
        (part as Record<string, unknown>).body &&
        typeof (part as Record<string, unknown>).body === 'object' &&
        (part as { body: Record<string, unknown> }).body.data
      ) {
        if ((part as Record<string, unknown>).mimeType === 'text/plain') {
          const decodedText = decodeBase64ToUtf8((part as { body: { data: string } }).body.data);
          text += cleanEmailText(decodedText);
        } else if ((part as Record<string, unknown>).mimeType === 'text/html') {
          const decodedHtml = decodeBase64ToUtf8((part as { body: { data: string } }).body.data);
          html += cleanEmailText(decodedHtml);
        }
      } else if (part && typeof part === 'object' && 'parts' in part && Array.isArray((part as Record<string, unknown>).parts)) {
        (part as { parts: unknown[] }).parts.forEach(extractFromPart);
      }
    };

    if (payload.parts && Array.isArray(payload.parts)) {
      payload.parts.forEach(extractFromPart);
    } else if (payload.body && typeof payload.body === 'object' && (payload.body as Record<string, unknown>).data) {
      extractFromPart(payload);
    }

    return { text, html };
  }

  /**
   * Extract attachments from Gmail message payload
   */
  private extractAttachments(payload: Record<string, unknown>): GmailAttachment[] {
    const attachments: GmailAttachment[] = [];

    const extractFromPart = (part: unknown) => {
      if (
        part &&
        typeof part === 'object' &&
        'filename' in part &&
        'mimeType' in part &&
        'body' in part &&
        (part as Record<string, unknown>).body &&
        typeof (part as Record<string, unknown>).body === 'object' &&
        'attachmentId' in (part as { body: Record<string, unknown> }).body
      ) {
        attachments.push({
          attachmentId: (part as { body: { attachmentId: string } }).body.attachmentId,
          size: (part as { body: { size?: number } }).body.size || 0,
          filename: (part as { filename: string }).filename,
          mimeType: (part as { mimeType: string }).mimeType,
        });
      }
      if (part && typeof part === 'object' && 'parts' in part && Array.isArray((part as Record<string, unknown>).parts)) {
        (part as { parts: unknown[] }).parts.forEach(extractFromPart);
      }
    };

    if (payload.parts && Array.isArray(payload.parts)) {
      payload.parts.forEach(extractFromPart);
    }

    return attachments;
  }

  /**
   * Transform Gmail message to EmailArtifactContent
   */
  async transformGmailMessage(
    message: GmailMessage, 
    threadPosition: number, 
    threadLength: number
  ): Promise<EmailArtifactContent> {
    if (!message.payload) {
      throw new Error('Message payload is missing');
    }

    const headers = this.parseEmailHeaders(message.payload.headers || []);
    const content = this.extractTextContent(message.payload as unknown as Record<string, unknown>);
    const attachments = this.extractAttachments(message.payload as unknown as Record<string, unknown>);

    // Parse internal date
    const internalDate = message.internalDate 
      ? new Date(parseInt(message.internalDate)).toISOString()
      : new Date().toISOString();

    return {
      message_id: message.id,
      thread_id: message.threadId,
      subject: cleanEmailText(headers.subject),
      from: headers.from,
      to: headers.to,
      cc: headers.cc,
      bcc: headers.bcc,
      date: internalDate,
      body_text: content.text,
      body_html: content.html,
      snippet: cleanEmailText(message.snippet || ''),
      
      thread_position: threadPosition,
      thread_length: threadLength,
      in_reply_to: headers.inReplyTo,
      references: headers.references,
      
      labels: message.labelIds || [],
      is_read: !message.labelIds?.includes('UNREAD'),
      is_starred: message.labelIds?.includes('STARRED') || false,
      size_estimate: message.sizeEstimate,
      internal_date: internalDate,
      history_id: message.historyId,
      
      attachments,
      has_attachments: attachments.length > 0,
      
      sync_source: 'gmail_api',
      last_synced_at: new Date().toISOString(),
      
      // These will be populated by AI processing
      matched_contacts: [],
      unmatched_emails: [],
    };
  }

  /**
   * Sync emails for a specific contact (server-side version)
   */
  async syncContactEmailsServer(request: EmailImportRequest, userId: string): Promise<EmailSyncProgress> {
    const progress: EmailSyncProgress = {
      total_emails: 0,
      processed_emails: 0,
      created_artifacts: 0,
      updated_artifacts: 0,
      errors: 0,
      current_status: 'Starting sync...',
    };

    try {
      // Use service role key for server-side operations
      const supabaseServer = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get user's Gmail tokens
      const { data: tokenRecord, error: tokenError } = await supabaseServer
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (tokenError || !tokenRecord?.gmail_access_token) {
        throw new Error('Gmail not connected. Please connect your Gmail account first.');
      }

      // Build search query for contact emails
      const emailQueries = request.email_addresses.map(email => `from:${email} OR to:${email}`);
      const query = emailQueries.join(' OR ');

      // Add date range if specified
      let searchQuery = query;
      if (request.date_range) {
        const startDate = new Date(request.date_range.start);
        const endDate = new Date(request.date_range.end);
        const startFormatted = startDate.toISOString().split('T')[0];
        const endFormatted = endDate.toISOString().split('T')[0];
        searchQuery += ` after:${startFormatted} before:${endFormatted}`;
        console.log(`📧 Date range processed: ${startFormatted} to ${endFormatted} (from ${request.date_range.start} to ${request.date_range.end})`);
      }

      progress.current_status = 'Searching for emails...';

      console.log(`📧 Gmail search query: "${searchQuery}"`);
      console.log(`📧 Contact emails being searched: ${request.email_addresses.join(', ')}`);

      // Check if token needs refresh
      let accessToken = tokenRecord.gmail_access_token;
      const tokenExpiry = tokenRecord.gmail_token_expiry ? new Date(tokenRecord.gmail_token_expiry) : null;
      const now = new Date();

      if (tokenExpiry && now >= tokenExpiry) {
        console.log('📧 Gmail token expired, refreshing...');
        
        // Refresh the token
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokenRecord.gmail_refresh_token!,
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        });

        if (!refreshResponse.ok) {
          throw new Error('Failed to refresh Gmail token. Please reconnect your Gmail account.');
        }

        const refreshData = await refreshResponse.json();
        
        // Update token in database
        const newExpiry = new Date(Date.now() + (refreshData.expires_in * 1000));
        await supabaseServer
          .from('user_tokens')
          .update({
            gmail_access_token: refreshData.access_token,
            gmail_token_expiry: newExpiry.toISOString(),
          })
          .eq('user_id', userId);

        accessToken = refreshData.access_token;
        console.log('📧 Gmail token refreshed successfully');
      }

      // Make direct Gmail API call with token
      const searchParams = new URLSearchParams({
        q: searchQuery,
        maxResults: (request.max_results || 100).toString(),
      });

      console.log(`📧 Full Gmail API URL: ${GMAIL_API_BASE}/users/me/messages?${searchParams.toString()}`);

      const searchResponse = await fetch(`${GMAIL_API_BASE}/users/me/messages?${searchParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error(`📧 Gmail API search error: ${searchResponse.status} ${searchResponse.statusText}`, errorText);
        throw new Error(`Gmail API search error: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchResult = await searchResponse.json();
      console.log(`📧 Gmail search result:`, searchResult);
      progress.total_emails = searchResult.messages?.length || 0;

      if (progress.total_emails === 0) {
        progress.current_status = 'No emails found';
        return progress;
      }

      progress.current_status = 'Processing emails...';

      // Process each message
      for (const messageRef of searchResult.messages || []) {
        try {
          // Get full message details
          const messageResponse = await fetch(`${GMAIL_API_BASE}/users/me/messages/${messageRef.id}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!messageResponse.ok) {
            throw new Error(`Failed to get message ${messageRef.id}`);
          }

          const message = await messageResponse.json();
          
          // Get thread to determine position
          const threadResponse = await fetch(`${GMAIL_API_BASE}/users/me/threads/${message.threadId}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!threadResponse.ok) {
            throw new Error(`Failed to get thread ${message.threadId}`);
          }

          const thread = await threadResponse.json();
          const threadPosition = thread.messages.findIndex((m: { id: string }) => m.id === message.id) + 1;
          const threadLength = thread.messages.length;

          // Transform to artifact content
          const emailContent = await this.transformGmailMessage(message, threadPosition, threadLength);

          // Check if artifact already exists
          const { data: existing } = await supabaseServer
            .from('artifacts')
            .select('id')
            .eq('type', 'email')
            .eq('contact_id', request.contact_id)
            .contains('metadata', { message_id: message.id })
            .single();

          if (existing) {
            // Update existing artifact
            const { error } = await supabaseServer
              .from('artifacts')
              .update({
                content: emailContent.snippet,
                metadata: emailContent,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);

            if (error) throw error;
            progress.updated_artifacts++;
          } else {
            // Create new artifact with AI parsing enabled
            const { error } = await supabaseServer
              .from('artifacts')
              .insert({
                user_id: userId,
                contact_id: request.contact_id,
                type: 'email',
                content: emailContent.snippet,
                metadata: emailContent,
                timestamp: emailContent.date,
                ai_parsing_status: 'pending',
              });

            if (error) throw error;
            progress.created_artifacts++;
          }

          progress.processed_emails++;
          progress.current_status = `Processed ${progress.processed_emails} of ${progress.total_emails} emails`;

        } catch (error) {
          console.error('Error processing email:', messageRef.id, error);
          progress.errors++;
        }
      }

      progress.current_status = 'Email sync completed';
      
      // Update sync state
      await supabaseServer
        .from('gmail_sync_state')
        .upsert({
          user_id: userId,
          total_emails_synced: (tokenRecord.total_emails_synced || 0) + progress.created_artifacts + progress.updated_artifacts,
          sync_status: 'idle',
          error_message: undefined,
          last_sync_timestamp: new Date().toISOString(),
        });

      return progress;

    } catch (error) {
      progress.current_status = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      // Update sync state with error
      try {
        const supabaseServer = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabaseServer
          .from('gmail_sync_state')
          .upsert({
            user_id: userId,
            sync_status: 'error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
      } catch (syncStateError) {
        console.error('Error updating sync state:', syncStateError);
      }

      throw error;
    }
  }

  /**
   * Sync emails for a specific contact (client-side version)
   */
  async syncContactEmails(request: EmailImportRequest): Promise<EmailSyncProgress> {
    const progress: EmailSyncProgress = {
      total_emails: 0,
      processed_emails: 0,
      created_artifacts: 0,
      updated_artifacts: 0,
      errors: 0,
      current_status: 'Starting sync...',
    };

    try {
      // Build search query for contact emails
      const emailQueries = request.email_addresses.map(email => `from:${email} OR to:${email}`);
      const query = emailQueries.join(' OR ');

      // Add date range if specified
      let searchQuery = query;
      if (request.date_range) {
        searchQuery += ` after:${request.date_range.start.split('T')[0]} before:${request.date_range.end.split('T')[0]}`;
      }

      progress.current_status = 'Searching for emails...';

      // Search for messages
      const searchResult = await this.searchMessages(searchQuery, request.max_results || 100);
      progress.total_emails = searchResult.messages?.length || 0;

      if (progress.total_emails === 0) {
        progress.current_status = 'No emails found';
        return progress;
      }

      progress.current_status = 'Processing emails...';

      // Process each message
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      for (const messageRef of searchResult.messages || []) {
        try {
          // Get full message details
          const message = await this.getMessage(messageRef.id);
          
          // Get thread to determine position
          const thread = await this.getThread(message.threadId);
          const threadPosition = thread.messages.findIndex(m => m.id === message.id) + 1;
          const threadLength = thread.messages.length;

          // Transform to artifact content
          const emailContent = await this.transformGmailMessage(message, threadPosition, threadLength);

          // Check if artifact already exists
          const { data: existing } = await this.supabase
            .from('artifacts')
            .select('id')
            .eq('type', 'email')
            .eq('contact_id', request.contact_id)
            .contains('metadata', { message_id: message.id })
            .single();

          if (existing) {
            // Update existing artifact
            const { error } = await this.supabase
              .from('artifacts')
              .update({
                content: emailContent.snippet,
                metadata: emailContent,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);

            if (error) throw error;
            progress.updated_artifacts++;
          } else {
            // Create new artifact with AI parsing enabled
            const { error } = await this.supabase
              .from('artifacts')
              .insert({
                user_id: user.id,
                contact_id: request.contact_id,
                type: 'email',
                content: emailContent.snippet,
                metadata: emailContent,
                timestamp: emailContent.date,
                ai_parsing_status: 'pending',
              });

            if (error) throw error;
            progress.created_artifacts++;
          }

          progress.processed_emails++;
          progress.current_status = `Processed ${progress.processed_emails} of ${progress.total_emails} emails`;

        } catch (error) {
          console.error('Error processing email:', messageRef.id, error);
          progress.errors++;
        }
      }

      progress.current_status = 'Email sync completed';
      
      // Update sync state
      await this.updateSyncState({
        total_emails_synced: progress.created_artifacts + progress.updated_artifacts,
        sync_status: 'idle',
        error_message: undefined,
      });

      return progress;

    } catch (error) {
      progress.current_status = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      // Update sync state with error
      await this.updateSyncState({
        sync_status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Update Gmail sync state
   */
  private async updateSyncState(updates: Partial<GmailSyncState>): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return;

    const { error } = await this.supabase
      .from('gmail_sync_state')
      .upsert({
        user_id: user.id,
        ...updates,
      });

    if (error) {
      console.error('Error updating sync state:', error);
    }
  }

  /**
   * Get current sync state (server-side version)
   */
  async getSyncStateServer(userId: string): Promise<GmailSyncState | null> {
    // Use service role key for server-side operations
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseServer
      .from('gmail_sync_state')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get current sync state (client-side version)
   */
  async getSyncState(): Promise<GmailSyncState | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('gmail_sync_state')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Disconnect Gmail
   */
  async disconnect(): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return;

    // Clear tokens
    await this.supabase
      .from('user_tokens')
      .update({
        gmail_access_token: undefined,
        gmail_refresh_token: undefined,
        gmail_token_expiry: undefined,
      })
      .eq('user_id', user.id);

    // Clear sync state
    await this.supabase
      .from('gmail_sync_state')
      .delete()
      .eq('user_id', user.id);
  }
}

// Export singleton instance
export const gmailService = new GmailService(); 