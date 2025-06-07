'use client';

import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Box, type SxProps, type Theme } from '@mui/material';

interface SafeHtmlRendererProps {
  html: string;
  sx?: SxProps<Theme>;
  className?: string;
}

/**
 * Safely renders HTML content with sanitization to prevent XSS attacks
 * Perfect for email content, user-generated content, etc.
 */
export const SafeHtmlRenderer: React.FC<SafeHtmlRendererProps> = ({
  html,
  sx,
  className,
}) => {
  const sanitizedHtml = useMemo(() => {
    if (!html) return '';
    
    // Sanitize HTML with DOMPurify using safe defaults for email content
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote', 'pre', 'code',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'hr'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'alt', 'src', 'width', 'height',
        'style', 'class', 'id', 'target', 'rel'
      ]
    });
    
    // Post-process to ensure links open in new tabs
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitized;
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
    
    return tempDiv.innerHTML;
  }, [html]);

  if (!sanitizedHtml) {
    return null;
  }

  return (
    <Box
      component="div"
      sx={{
        // Clean email styling - remove visual noise from email clients
        '& *': {
          maxWidth: '100% !important',
          wordWrap: 'break-word',
          // Remove email client styling noise
          border: 'none !important',
          borderRadius: '0 !important',
          boxShadow: 'none !important',
          outline: 'none !important',
        },
        
        // Remove backgrounds and borders from structural elements
        '& div, & table, & tbody, & tr, & td': {
          backgroundColor: 'transparent !important',
          border: 'none !important',
          margin: '0 !important',
          padding: '0 !important',
        },
        
        // Clean paragraph styling
        '& p': {
          margin: '0 0 16px 0 !important',
          padding: '0 !important',
          lineHeight: '1.6 !important',
          backgroundColor: 'transparent !important',
          border: 'none !important',
        },
        '& p:last-child': {
          marginBottom: '0 !important',
        },
        '& p:empty': {
          display: 'none',
        },
        
        // Clean headers
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          margin: '24px 0 12px 0 !important',
          padding: '0 !important',
          fontWeight: '600 !important',
          backgroundColor: 'transparent !important',
          border: 'none !important',
          lineHeight: '1.3 !important',
        },
        '& h1:first-child, & h2:first-child, & h3:first-child, & h4:first-child, & h5:first-child, & h6:first-child': {
          marginTop: '0 !important',
        },
        
        // Clean lists
        '& ul, & ol': {
          margin: '0 0 16px 0 !important',
          paddingLeft: '20px !important',
          backgroundColor: 'transparent !important',
        },
        '& li': {
          margin: '4px 0 !important',
          padding: '0 !important',
          backgroundColor: 'transparent !important',
        },
        
        // Clean blockquotes - keep minimal styling
        '& blockquote': {
          margin: '16px 0 !important',
          padding: '12px 16px !important',
          backgroundColor: '#f9f9f9 !important',
          fontStyle: 'italic',
          border: 'none !important',
          borderLeft: '3px solid #ddd !important',
        },
        
        // Clean links
        '& a': {
          color: 'primary.main !important',
          textDecoration: 'none !important',
          backgroundColor: 'transparent !important',
          border: 'none !important',
          padding: '0 !important',
          '&:hover': {
            textDecoration: 'underline !important',
          },
        },
        
        // Clean images
        '& img': {
          maxWidth: '100% !important',
          height: 'auto !important',
          border: 'none !important',
          borderRadius: '4px !important', // Keep slight rounding
          margin: '8px 0 !important',
          display: 'block !important',
        },
        
        // Completely clean tables - remove all email client styling
        '& table': {
          borderCollapse: 'collapse !important',
          width: '100% !important',
          margin: '0 !important',
          padding: '0 !important',
          backgroundColor: 'transparent !important',
          border: 'none !important',
        },
        '& th, & td': {
          border: 'none !important',
          padding: '4px 0 !important',
          margin: '0 !important',
          backgroundColor: 'transparent !important',
          textAlign: 'left !important',
          verticalAlign: 'top !important',
        },
        
        // Clean horizontal rules
        '& hr': {
          margin: '20px 0 !important',
          border: 'none !important',
          borderTop: '1px solid #e0e0e0 !important',
          backgroundColor: 'transparent !important',
        },
        
        // Clean code blocks
        '& pre, & code': {
          backgroundColor: '#f5f5f5 !important',
          padding: '4px 6px !important',
          borderRadius: '4px !important',
          fontFamily: 'monospace !important',
          border: 'none !important',
          margin: '0 !important',
        },
        '& pre': {
          padding: '12px !important',
          margin: '16px 0 !important',
          overflow: 'auto !important',
          display: 'block !important',
        },
        
        // Clean spans and other inline elements
        '& span': {
          backgroundColor: 'transparent !important',
          border: 'none !important',
          padding: '0 !important',
          margin: '0 !important',
        },
        
        // Remove empty elements that create visual noise
        '& div:empty, & p:empty, & span:empty': {
          display: 'none !important',
        },
        
        // Clean font and text styling - preserve colors but remove backgrounds
        '& *[style*="background"]': {
          backgroundColor: 'transparent !important',
        },
        
        ...sx,
      }}
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}; 