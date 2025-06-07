import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { EmailArtifact, EmailThread } from '@/types/email';

interface UseEmailThreadProps {
  threadId?: string;
  contactId?: string;
  enabled?: boolean;
}

export const useEmailThread = ({ threadId, contactId, enabled = true }: UseEmailThreadProps) => {
  return useQuery({
    queryKey: ['emailThread', threadId, contactId],
    queryFn: async (): Promise<EmailThread | null> => {
      if (!threadId || !contactId) {
        return null;
      }

      // Fetch all email artifacts for this thread from the database
      const { data: emails, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('type', 'email')
        .eq('contact_id', contactId)
        .contains('metadata', { thread_id: threadId })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching thread emails:', error);
        throw error;
      }

      if (!emails || emails.length === 0) {
        return null;
      }

      // Convert database rows to EmailArtifact objects
      const emailArtifacts: EmailArtifact[] = emails.map(email => ({
        ...email,
        type: 'email' as const,
        metadata: email.metadata as any, // Cast to any to avoid complex Json type conflicts
        ai_parsing_status: email.ai_parsing_status as EmailArtifact['ai_parsing_status']
      }));

      // Helper function to determine email direction
      const getEmailDirection = (email: EmailArtifact): 'sent' | 'received' => {
        const labels = email.metadata?.labels || [];
        const fromEmail = email.metadata?.from?.email?.toLowerCase() || '';
        
        if (labels.includes('SENT')) return 'sent';
        if (labels.includes('INBOX')) return 'received';
        
        if (fromEmail.includes('hfinkelstein@gmail.com') || fromEmail.includes('henry@')) {
          return 'sent';
        }
        
        return 'received';
      };

      const getEmailImportance = (email: EmailArtifact): 'high' | 'normal' | 'low' => {
        const labels = email.metadata?.labels || [];
        
        if (labels.includes('IMPORTANT') || labels.includes('CATEGORY_PRIMARY')) {
          return 'high';
        }
        
        if (labels.includes('CATEGORY_PROMOTIONS') || labels.includes('CATEGORY_UPDATES')) {
          return 'low';
        }
        
        return 'normal';
      };

      // Sort emails chronologically
      const sortedEmails = emailArtifacts.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.created_at).getTime();
        const dateB = new Date(b.timestamp || b.created_at).getTime();
        return dateA - dateB;
      });

      const latestEmail = sortedEmails[sortedEmails.length - 1];
      const earliestEmail = sortedEmails[0];

      // Extract unique participants
      const participants = new Map<string, { email: string; name?: string }>();
      
      sortedEmails.forEach(email => {
        if (email.metadata?.from) {
          participants.set(email.metadata.from.email, email.metadata.from);
        }
        email.metadata?.to?.forEach(p => participants.set(p.email, p));
        email.metadata?.cc?.forEach(p => participants.set(p.email, p));
      });

      // Combine all labels
      const allLabels = [...new Set(sortedEmails.flatMap(e => e.metadata?.labels || []))];

      // Determine thread characteristics
      const sentCount = sortedEmails.filter(e => getEmailDirection(e) === 'sent').length;
      const receivedCount = sortedEmails.filter(e => getEmailDirection(e) === 'received').length;
      const threadDirection = sentCount > receivedCount ? 'sent' : receivedCount > sentCount ? 'received' : 'mixed';
      const highImportanceCount = sortedEmails.filter(e => getEmailImportance(e) === 'high').length;

      return {
        thread_id: threadId,
        subject: latestEmail.metadata?.subject || 'No Subject',
        participants: Array.from(participants.values()),
        message_count: sortedEmails.length,
        unread_count: sortedEmails.filter(e => e.metadata?.is_read === false).length,
        has_starred: sortedEmails.some(e => e.metadata?.is_starred),
        has_attachments: sortedEmails.some(e => e.metadata?.has_attachments),
        latest_date: latestEmail.timestamp || latestEmail.created_at,
        earliest_date: earliestEmail.timestamp || earliestEmail.created_at,
        labels: allLabels,
        messages: sortedEmails,
        direction: threadDirection,
        sent_count: sentCount,
        received_count: receivedCount,
        importance: highImportanceCount > 0 ? 'high' : 'normal',
      };
    },
    enabled: enabled && !!threadId && !!contactId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}; 