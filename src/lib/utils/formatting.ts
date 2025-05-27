'use client';

// Basic function to make field paths more human-readable
export const formatFieldPathForDisplay = (fieldPath: string): string => {
  if (!fieldPath) return '';

  // Replace common prefixes or map them
  let displayPath = fieldPath
    .replace(/^personal_context\./, 'Personal Context > ')
    .replace(/^professional_context\./, 'Professional Context > ')
    .replace(/^general_context\./, 'General Context > ');

  // Split by dot, then format each part
  displayPath = displayPath.split('.').map(part => {
    // Handle array indices like children.0.name -> Children 1 Name
    if (/^\d+$/.test(part)) { // If part is just a number (array index)
      // This part is tricky if we don't know the preceding segment's singular form.
      // For now, let's assume the part before it was plural and this is an index.
      // A more robust solution would require schema introspection or a detailed map.
      return `Item ${parseInt(part, 10) + 1}`;
    }
    // Replace underscores and capitalize
    return part.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }).join(' > ');

  // Specific replacements for better readability
  displayPath = displayPath
    .replace(/children > (\d+) > name/gi, 'Child $1 Name') // children.0.name -> Child 1 Name
    .replace(/children > (\d+) > details/gi, 'Child $1 Details')
    .replace(/key life events > (\d+)/gi, 'Key Life Event $1');
    // Add more specific rules as needed

  return displayPath;
};

// You can add other formatting utils here, e.g., for dates, numbers, etc.
// Example: (already used elsewhere, but could be centralized)
// export const formatDate = (dateString: string, formatStr: string = 'PPP p'): string => {
//   try {
//     return format(parseISO(dateString), formatStr);
//   } catch (error) {
//     console.warn('Error formatting date:', dateString, error);
//     return 'Invalid date';
//   }
// }; 