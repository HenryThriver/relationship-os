import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await req.json();
    const { contact_id, user_id, email_addresses, date_range, max_results } = body;

    // Validate required fields
    if (!contact_id || !user_id || !email_addresses?.length) {
      return new Response(JSON.stringify({
        error: 'contact_id, user_id, and email_addresses are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get user's Gmail tokens
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (tokenError || !tokenRecord?.gmail_access_token) {
      return new Response(JSON.stringify({
        error: 'Gmail not connected for this user'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build search query
    const emailQueries = email_addresses.map((email: string) => `from:${email} OR to:${email}`);
    let searchQuery = emailQueries.join(' OR ');

    // Add date range if specified
    if (date_range) {
      const startDate = new Date(date_range.start);
      const endDate = new Date(date_range.end);
      const startFormatted = startDate.toISOString().split('T')[0];
      const endFormatted = endDate.toISOString().split('T')[0];
      searchQuery += ` after:${startFormatted} before:${endFormatted}`;
    }

    console.log(`📧 Gmail sync for contact ${contact_id}, query: ${searchQuery}`);

    // Search for messages
    const searchResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=${max_results || 100}`,
      {
        headers: {
          'Authorization': `Bearer ${tokenRecord.gmail_access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Gmail API search failed: ${searchResponse.statusText}`);
    }

    const searchResult = await searchResponse.json();
    const messages = searchResult.messages || [];

    console.log(`📧 Found ${messages.length} messages`);

    let processedEmails = 0;
    let createdArtifacts = 0;

    // Process each message
    for (const messageRef of messages) {
      try {
        // Get full message details
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageRef.id}`,
          {
            headers: {
              'Authorization': `Bearer ${tokenRecord.gmail_access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!messageResponse.ok) {
          console.warn(`Failed to get message ${messageRef.id}: ${messageResponse.statusText}`);
          continue;
        }

        const message = await messageResponse.json();

        // Transform message to email artifact content
        const emailContent = await transformGmailMessage(message);

        // Check if artifact already exists
        const { data: existing } = await supabase
          .from('artifacts')
          .select('id')
          .eq('type', 'email')
          .eq('contact_id', contact_id)
          .contains('metadata', { message_id: message.id })
          .single();

        if (!existing) {
          // Create new artifact
          const { error } = await supabase
            .from('artifacts')
            .insert({
              user_id: user_id,
              contact_id: contact_id,
              type: 'email',
              content: emailContent.snippet,
              metadata: emailContent,
              timestamp: emailContent.date,
            });

          if (!error) {
            createdArtifacts++;
          }
        }

        processedEmails++;

      } catch (error) {
        console.warn(`Error processing message ${messageRef.id}:`, error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      progress: {
        total_emails: messages.length,
        processed_emails: processedEmails,
        created_artifacts: createdArtifacts,
        updated_artifacts: 0,
        errors: 0,
        current_status: 'Completed'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Gmail sync error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Transform Gmail message to EmailArtifactContent
 */
async function transformGmailMessage(message: any) {
  const headers = parseEmailHeaders(message.payload.headers || []);
  const content = extractTextContent(message.payload);

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
    
    thread_position: 1, // Simplified for nightly sync
    thread_length: 1,
    
    labels: message.labelIds || [],
    is_read: !message.labelIds?.includes('UNREAD'),
    is_starred: message.labelIds?.includes('STARRED') || false,
    size_estimate: message.sizeEstimate,
    internal_date: internalDate,
    history_id: message.historyId,
    
    attachments: [],
    has_attachments: false,
    
    sync_source: 'gmail_api',
    last_synced_at: new Date().toISOString(),
    
    matched_contacts: [],
    unmatched_emails: [],
  };
}

/**
 * Parse email headers
 */
function parseEmailHeaders(headers: any[]) {
  const headerMap: any = {};
  
  headers.forEach(header => {
    headerMap[header.name.toLowerCase()] = header.value;
  });

  return {
    subject: headerMap['subject'] || '',
    from: parseEmailAddress(headerMap['from'] || ''),
    to: parseEmailAddressList(headerMap['to'] || ''),
    cc: parseEmailAddressList(headerMap['cc'] || ''),
    bcc: parseEmailAddressList(headerMap['bcc'] || ''),
  };
}

/**
 * Parse email address
 */
function parseEmailAddress(addressString: string) {
  if (!addressString) return { email: '', name: '' };
  
  const match = addressString.match(/^(.*?)\s*<(.+?)>$/) || addressString.match(/^(.+)$/);
  
  if (match) {
    if (match[2]) {
      return {
        name: match[1].trim().replace(/^["']|["']$/g, ''),
        email: match[2].trim()
      };
    } else {
      return {
        name: '',
        email: match[1].trim()
      };
    }
  }
  
  return { email: addressString, name: '' };
}

/**
 * Parse email address list
 */
function parseEmailAddressList(addressString: string) {
  if (!addressString) return [];
  
  return addressString.split(',').map(addr => parseEmailAddress(addr.trim()));
}

/**
 * Extract text content from message payload
 */
function extractTextContent(payload: any) {
  let text = '';
  let html = '';

  function extractFromPart(part: any) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      text += decodeBase64ToUtf8(part.body.data);
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      html += decodeBase64ToUtf8(part.body.data);
    } else if (part.parts) {
      part.parts.forEach(extractFromPart);
    }
  }

  extractFromPart(payload);

  return { text, html };
}

/**
 * Decode base64 to UTF-8
 */
function decodeBase64ToUtf8(base64String: string): string {
  try {
    // Replace URL-safe base64 characters
    const standardBase64 = base64String.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 to bytes
    const binaryString = atob(standardBase64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Decode bytes to UTF-8 string
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch (error) {
    console.warn('Error decoding base64:', error);
    return base64String; // Fallback to original
  }
}

/**
 * Clean email text
 */
function cleanEmailText(text: string): string {
  if (!text) return '';
  
  // Clean common mojibake patterns
  return text
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€¦/g, '...')
    .replace(/â€"/g, '—')
    .replace(/Â/g, '')
    .replace(/\r\n|\r|\n/g, '\n')
    .trim();
} 