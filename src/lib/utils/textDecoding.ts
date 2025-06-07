/**
 * Text decoding utilities for fixing Gmail API encoding issues
 */

/**
 * Properly decode base64 data to UTF-8 text
 * Gmail API returns base64-encoded content that needs proper UTF-8 handling
 */
export function decodeBase64ToUtf8(base64Data: string): string {
  try {
    // First decode base64 to bytes
    const binaryString = atob(base64Data.replace(/-/g, '+').replace(/_/g, '/'));
    
    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Decode bytes as UTF-8
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch (error) {
    console.warn('Failed to decode base64 as UTF-8:', error);
    // Fallback to simple atob if UTF-8 decoding fails
    return atob(base64Data.replace(/-/g, '+').replace(/_/g, '/'));
  }
}

/**
 * Clean email text content from various encoding issues
 */
export function cleanEmailText(text: string): string {
  if (!text) return '';
  
  return text
    // Fix common UTF-8 mojibake patterns
    .replace(/â€™/g, "'")      // Smart apostrophe
    .replace(/â€œ/g, '"')      // Smart quote open  
    .replace(/â€/g, '"')       // Smart quote close
    .replace(/â€¦/g, '...')    // Ellipsis
    .replace(/â€"/g, '—')      // Em dash
    .replace(/â€"/g, '–')      // En dash
    .replace(/â€¢/g, '•')      // Bullet point
    
    // Remove stray Â characters (common in double-encoded text)
    .replace(/Â(?=[€œ"'])/g, '') // Â before special chars
    .replace(/Â/g, '')           // All other Â chars
    
    // Fix unicode escape sequences that got literally encoded
    .replace(/\\u0080\\u0099/g, "'")  // Another smart apostrophe pattern
    .replace(/\\u0080\\u009c/g, '"')  // Another smart quote pattern
    .replace(/\\u0080\\u009d/g, '"')  // Another smart quote pattern
    
    // Decode common HTML entities that might be double-encoded
    .replace(/&amp;#(\d+);/g, (match, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&amp;#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    
    // Standard HTML entity decoding
    .replace(/&#(\d+);/g, (match, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&ensp;/g, ' ')
    .replace(/&emsp;/g, ' ')
    .replace(/&thinsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    
    // Normalize line breaks BEFORE cleaning whitespace
    .replace(/\r\n/g, '\n')      // Windows line breaks to Unix
    .replace(/\r/g, '\n')        // Mac line breaks to Unix
    
    // Clean up excessive whitespace but preserve line breaks
    .replace(/[ \t]+/g, ' ')     // Multiple spaces/tabs to single space
    .replace(/\n[ \t]+/g, '\n')  // Remove spaces/tabs after line breaks
    .replace(/[ \t]+\n/g, '\n')  // Remove spaces/tabs before line breaks
    .replace(/\n\n\n+/g, '\n\n') // Max two consecutive line breaks
    .trim();
}

/**
 * Clean HTML content to readable text with proper encoding
 */
export function cleanHtmlToText(html: string): string {
  if (!html) return '';
  
  const cleanedHtml = html
    // Remove script and style tags entirely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove head section if present
    .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '')
    
    // Convert block elements to line breaks (order matters)
    .replace(/<\/p>/gi, '\n\n')          // Paragraphs get double line breaks
    .replace(/<p\b[^>]*>/gi, '')         // Remove opening p tags
    .replace(/<\/div>/gi, '\n')          // Divs get single line breaks
    .replace(/<div\b[^>]*>/gi, '')       // Remove opening div tags
    .replace(/<br\s*\/?>/gi, '\n')       // Line breaks
    .replace(/<\/?(h[1-6])\b[^>]*>/gi, '\n') // Headers get line breaks
    .replace(/<\/li>/gi, '\n')           // List items end with line break
    .replace(/<li\b[^>]*>/gi, '• ')      // List items start with bullet
    .replace(/<\/?(tr|td|th)\b[^>]*>/gi, '\n') // Table elements
    
    // Remove all other HTML tags
    .replace(/<[^>]*>/g, '')
    
    // Clean up resulting text
    .replace(/\n\s*\n\s*\n+/g, '\n\n')   // Max two consecutive line breaks
    .replace(/^\n+|\n+$/g, '');          // Remove leading/trailing line breaks
    
  // Apply text cleaning
  return cleanEmailText(cleanedHtml);
} 