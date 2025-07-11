// import { google } from 'googleapis';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { 
  GoogleCalendarEvent, 
  ContactEmailMatch, 
  SyncResults, 
  CalendarSyncOptions,
  UserIntegration,
  CalendarSyncLog
} from '@/types/calendar';

// Note: googleapis is not available in this environment, using placeholder types
type OAuth2Client = {
  setCredentials: (credentials: Record<string, unknown>) => void;
  on: (event: string, callback: (tokens: Record<string, unknown>) => void) => void;
};

type CalendarAPI = {
  events: {
    list: (params: Record<string, unknown>) => Promise<{
      data: {
        items?: Record<string, unknown>[];
      };
    }>;
  };
};

export class GoogleCalendarService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Get user's Google Calendar integration
   */
  async getUserIntegration(userId: string): Promise<UserIntegration | null> {
    const { data, error } = await this.supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_type', 'google_calendar')
      .single();

    if (error || !data) {
      return null;
    }

    return data as UserIntegration;
  }

  /**
   * Create OAuth2 client with user's tokens
   */
  private async createOAuth2Client(integration: UserIntegration): Promise<OAuth2Client> {
    // Note: This is a placeholder implementation since googleapis is not available
    // In a real implementation, this would use google.auth.OAuth2
    const oauth2Client: OAuth2Client = {
      setCredentials: (credentials: Record<string, unknown>) => {
        // Implementation would set credentials
        console.log('Setting credentials:', credentials);
      },
      on: (event: string, _callback: (tokens: Record<string, unknown>) => void) => {
        // Implementation would handle token refresh events
        console.log('Registering event handler:', event, _callback);
      }
    };

    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expiry_date: integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : undefined,
    });

    // Handle token refresh
    oauth2Client.on('tokens', async (tokens: Record<string, unknown>) => {
      if (tokens.refresh_token) {
        await this.updateIntegrationTokens(integration.id, tokens);
      }
    });

    return oauth2Client;
  }

  /**
   * Update integration tokens after refresh
   */
  private async updateIntegrationTokens(integrationId: string, tokens: Record<string, unknown>): Promise<void> {
    const updateData: Record<string, unknown> = {
      access_token: tokens.access_token,
      updated_at: new Date().toISOString(),
    };

    if (tokens.refresh_token) {
      updateData.refresh_token = tokens.refresh_token;
    }

    if (tokens.expiry_date && typeof tokens.expiry_date === 'number') {
      updateData.token_expires_at = new Date(tokens.expiry_date).toISOString();
    }

    await this.supabase
      .from('user_integrations')
      .update(updateData)
      .eq('id', integrationId);
  }

  /**
   * Fetch calendar events from Google Calendar
   */
  async fetchMeetings(
    integration: UserIntegration, 
    options: CalendarSyncOptions
  ): Promise<GoogleCalendarEvent[]> {
    await this.createOAuth2Client(integration);
    
    // Note: This is a placeholder implementation since googleapis is not available
          // In a real implementation, this would use google.calendar({ version: 'v3', auth: oauth2Client })
    const calendar: CalendarAPI = {
      events: {
        list: async (params: Record<string, unknown>) => {
          console.log('Fetching events with params:', params);
          return { data: { items: [] } };
        }
      }
    };

    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: options.startDate.toISOString(),
        timeMax: options.endDate.toISOString(),
        maxResults: options.maxResults || 250,
        singleEvents: options.singleEvents ?? true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      
      // Filter out events without attendees (solo events) and declined events if specified
      return events
        .filter((event: Record<string, unknown>) => {
          if (!event.attendees || !Array.isArray(event.attendees) || event.attendees.length === 0) return false;
          if (!options.includeDeclined && event.status === 'cancelled') return false;
          return true;
        })
        .map((event: Record<string, unknown>) => ({
          id: (event.id as string) || '',
          summary: event.summary as string || undefined,
          description: event.description as string || undefined,
          start: {
            dateTime: (event.start as Record<string, unknown>)?.dateTime as string || undefined,
            date: (event.start as Record<string, unknown>)?.date as string || undefined,
            timeZone: (event.start as Record<string, unknown>)?.timeZone as string || undefined,
          },
          end: {
            dateTime: (event.end as Record<string, unknown>)?.dateTime as string || undefined,
            date: (event.end as Record<string, unknown>)?.date as string || undefined,
            timeZone: (event.end as Record<string, unknown>)?.timeZone as string || undefined,
          },
          attendees: Array.isArray(event.attendees) ? event.attendees.map((attendee: Record<string, unknown>) => ({
            email: (attendee.email as string) || '',
            displayName: attendee.displayName as string || undefined,
            responseStatus: attendee.responseStatus as 'accepted' | 'declined' | 'tentative' | 'needsAction',
            self: attendee.self as boolean || undefined,
            organizer: attendee.organizer as boolean || undefined,
          })) : [],
          organizer: event.organizer ? {
            email: ((event.organizer as Record<string, unknown>).email as string) || '',
            displayName: (event.organizer as Record<string, unknown>).displayName as string,
            self: (event.organizer as Record<string, unknown>).self as boolean,
          } : undefined,
          location: event.location as string || undefined,
          htmlLink: event.htmlLink as string || undefined,
          hangoutLink: event.hangoutLink as string || undefined,
          conferenceData: event.conferenceData ? {
            entryPoints: Array.isArray((event.conferenceData as Record<string, unknown>).entryPoints) 
              ? ((event.conferenceData as Record<string, unknown>).entryPoints as Record<string, unknown>[]).map((ep: Record<string, unknown>) => ({
                  entryPointType: (ep.entryPointType as string) || '',
                  uri: (ep.uri as string) || '',
                  label: ep.label as string,
                }))
              : [],
            conferenceSolution: (event.conferenceData as Record<string, unknown>).conferenceSolution ? {
              name: ((event.conferenceData as Record<string, unknown>).conferenceSolution as Record<string, unknown>).name as string || '',
              iconUri: ((event.conferenceData as Record<string, unknown>).conferenceSolution as Record<string, unknown>).iconUri as string,
            } : undefined,
            conferenceId: (event.conferenceData as Record<string, unknown>).conferenceId as string,
          } : undefined,
          recurringEventId: event.recurringEventId as string,
          created: event.created as string,
          updated: event.updated as string,
          status: event.status as 'confirmed' | 'tentative' | 'cancelled',
        }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error(`Failed to fetch calendar events: ${error}`);
    }
  }

  /**
   * Match calendar events to contacts by email
   */
  async matchEventsToContacts(
    events: GoogleCalendarEvent[], 
    userId: string
  ): Promise<Map<string, ContactEmailMatch[]>> {
    // Get all user's contacts with their primary emails and email_addresses array, EXCLUDING self-contacts
    const { data: contacts, error } = await this.supabase
      .from('contacts')
      .select('id, name, email, email_addresses')
      .eq('user_id', userId)
      .eq('is_self_contact', false); // Only include external contacts

    if (error || !contacts) {
      throw new Error(`Failed to fetch contacts: ${error?.message}`);
    }

    // Get all contact emails from the contact_emails table
    const { data: contactEmails, error: emailsError } = await this.supabase
      .from('contact_emails')
      .select('contact_id, email')
      .in('contact_id', contacts.map(c => c.id));

    if (emailsError) {
      console.warn('Failed to fetch contact emails:', emailsError.message);
    }

    // Create a map of email -> contact for faster lookup
    const emailToContactMap = new Map<string, { id: string; name: string; email: string }>();
    
    // Add primary emails from contacts table
    contacts.forEach(contact => {
      if (contact.email) {
        emailToContactMap.set(contact.email.toLowerCase(), {
          id: contact.id,
          name: contact.name || 'Unknown',
          email: contact.email
        });
      }
      
      // Add emails from email_addresses array
      if (contact.email_addresses && Array.isArray(contact.email_addresses)) {
        contact.email_addresses.forEach(email => {
          if (email) {
            emailToContactMap.set(email.toLowerCase(), {
              id: contact.id,
              name: contact.name || 'Unknown',
              email: email
            });
          }
        });
      }
    });

    // Add additional emails from contact_emails table
    if (contactEmails) {
      contactEmails.forEach(contactEmail => {
        const contact = contacts.find(c => c.id === contactEmail.contact_id);
        if (contact && contactEmail.email) {
          emailToContactMap.set(contactEmail.email.toLowerCase(), {
            id: contact.id,
            name: contact.name || 'Unknown',
            email: contactEmail.email
          });
        }
      });
    }

    const eventToContactsMap = new Map<string, ContactEmailMatch[]>();

    for (const event of events) {
      const matches: ContactEmailMatch[] = [];
      
      if (event.attendees) {
        for (const attendee of event.attendees) {
          // Skip self (the user)
          if (attendee.self) continue;

          // Find exact email matches only
          const matchedContact = emailToContactMap.get(attendee.email.toLowerCase());

          if (matchedContact) {
            matches.push({
              contactId: matchedContact.id,
              contactName: matchedContact.name,
              contactEmail: matchedContact.email,
              matchedEmail: attendee.email,
              confidence: 'exact',
            });
          }
        }
      }

      if (matches.length > 0) {
        eventToContactsMap.set(event.id, matches);
      }
    }

    return eventToContactsMap;
  }

  /**
   * Create meeting artifacts from matched events
   */
  async createMeetingArtifacts(
    eventToContactsMap: Map<string, ContactEmailMatch[]>,
    events: GoogleCalendarEvent[],
    userId: string
  ): Promise<{ created: number; errors: Array<{ eventId: string; error: string }> }> {
    let created = 0;
    const errors: Array<{ eventId: string; error: string }> = [];

    for (const event of events) {
      const matches = eventToContactsMap.get(event.id);
      if (!matches || matches.length === 0) continue;

      // Create artifact for the primary contact (highest confidence match)
      const primaryMatch = matches.sort((a, b) => {
        const confidenceOrder = { exact: 3, domain: 2, fuzzy: 1 };
        return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      })[0];

      try {
        const meetingDate = event.start.dateTime || event.start.date;
        // const _endDate = event.end.dateTime || event.end.date;
        
        let durationMinutes: number | undefined;
        if (event.start.dateTime && event.end.dateTime) {
          const start = new Date(event.start.dateTime);
          const end = new Date(event.end.dateTime);
          durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        }

        const metadata: Record<string, unknown> = {
          title: event.summary,
          attendees: event.attendees?.map(a => a.displayName || a.email) || [],
          meeting_date: meetingDate,
          location: event.location || undefined,
          google_calendar_id: event.id,
          google_calendar_link: event.hangoutLink,
          google_calendar_html_link: event.htmlLink,
          organizer: event.organizer ? {
            email: event.organizer.email,
            name: event.organizer.displayName,
            self: event.organizer.self,
          } : undefined,
          attendee_emails: event.attendees?.map(a => a.email) || [],
          duration_minutes: durationMinutes,
          recurring_event_id: event.recurringEventId,
          conference_data: event.conferenceData ? {
            type: event.hangoutLink ? 'google_meet' : 'other',
            join_url: event.hangoutLink || event.conferenceData.entryPoints?.[0]?.uri,
            conference_id: event.conferenceData.conferenceId,
          } : undefined,
          calendar_source: 'google',
          last_synced_at: new Date().toISOString(),
        };

        // Check if artifact already exists
        const { data: existingArtifacts } = await this.supabase
          .from('artifacts')
          .select('id')
          .eq('contact_id', primaryMatch.contactId)
          .eq('type', 'meeting')
          .eq('metadata->>google_calendar_id', event.id)
          .limit(1);

        if (existingArtifacts && existingArtifacts.length > 0) {
          const existingArtifact = existingArtifacts[0];
          // Update existing artifact
          await this.supabase
            .from('artifacts')
            .update({
              content: event.summary || 'Meeting',
              metadata,
              timestamp: meetingDate,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingArtifact.id);
        } else {
          // Create new artifact
          const { error: artifactError } = await this.supabase
            .from('artifacts')
            .insert({
              user_id: userId,
              contact_id: primaryMatch.contactId,
              type: 'meeting',
              content: event.summary || 'Meeting',
              timestamp: meetingDate,
              ai_parsing_status: 'pending',
              metadata: {
                title: event.summary,
                attendees: event.attendees?.map(a => a.displayName || a.email) || [],
                meeting_date: event.start?.dateTime || event.start?.date,
                location: event.location || undefined,
                google_calendar_id: event.id,
                google_calendar_link: event.hangoutLink,
                organizer: event.organizer ? {
                  email: event.organizer.email,
                  name: event.organizer.displayName,
                  self: event.organizer.self,
                } : undefined,
                attendee_emails: event.attendees?.map(a => a.email) || [],
                duration_minutes: durationMinutes,
                recurring_event_id: event.recurringEventId,
                conference_data: event.conferenceData ? {
                  type: event.hangoutLink ? 'google_meet' : 'other',
                  join_url: event.hangoutLink || event.conferenceData.entryPoints?.[0]?.uri,
                  conference_id: event.conferenceData.conferenceId,
                } : undefined,
                calendar_source: 'google',
                last_synced_at: new Date().toISOString(),
              } as Record<string, unknown>,
            })
            .select()
            .single();

          if (artifactError) {
            console.error(`Error creating artifact for event ${event.id}:`, artifactError);
            errors.push({
              eventId: event.id,
              error: artifactError instanceof Error ? artifactError.message : 'Unknown error',
            });
          } else {
            created++;
            
            // Create session action for meeting notes since imported meetings don't have notes by default
            await this.createMeetingNotesSessionAction(userId, primaryMatch.contactId, event.id, event.summary);
          }
        }
      } catch (error) {
        console.error(`Error creating artifact for event ${event.id}:`, error);
        errors.push({
          eventId: event.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { created, errors };
  }

  /**
   * Create session action for meeting notes when a new meeting is imported
   */
  private async createMeetingNotesSessionAction(
    userId: string, 
    contactId: string, 
    googleCalendarId: string, 
    meetingTitle?: string
  ): Promise<void> {
    try {
      // Get the contact's goal (if they have one)
      const { data: goalContact } = await this.supabase
        .from('goal_contacts')
        .select('goal_id')
        .eq('contact_id', contactId)
        .limit(1)
        .single();

      if (!goalContact) {
        console.log(`No goal found for contact ${contactId}, skipping session action creation`);
        return;
      }

      // Get the artifact ID for the meeting we just created
      const { data: artifact } = await this.supabase
        .from('artifacts')
        .select('id')
        .eq('contact_id', contactId)
        .eq('type', 'meeting')
        .eq('metadata->>google_calendar_id', googleCalendarId)
        .limit(1)
        .single();

      if (!artifact) {
        console.log(`Could not find artifact for meeting ${googleCalendarId}, skipping session action creation`);
        return;
      }

      // Create a session action for adding meeting notes
      // This will be picked up by future relationship building sessions
      const { error: sessionActionError } = await this.supabase
        .from('session_actions')
        .insert({
          user_id: userId,
          session_id: null, // Orphaned action - will be assigned to a session later
          action_type: 'add_meeting_notes',
          contact_id: contactId,
          goal_id: goalContact.goal_id,
          meeting_artifact_id: artifact.id,
          action_data: {
            meeting_title: meetingTitle || 'Meeting',
            google_calendar_id: googleCalendarId,
            created_from: 'calendar_sync',
            auto_created: true
          },
          status: 'pending'
        });

      if (sessionActionError) {
        console.error(`Error creating session action for meeting ${googleCalendarId}:`, sessionActionError);
      } else {
        console.log(`Created session action for meeting notes: ${meetingTitle || 'Meeting'} with contact ${contactId}`);
      }
    } catch (error) {
      console.error(`Error in createMeetingNotesSessionAction:`, error);
    }
  }

  /**
   * Create a sync log entry
   */
  async createSyncLog(userId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('calendar_sync_logs')
      .insert({
        user_id: userId,
        status: 'in_progress',
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create sync log: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Update sync log with results
   */
  async updateSyncLog(
    syncLogId: string,
    results: Partial<CalendarSyncLog>
  ): Promise<void> {
    await this.supabase
      .from('calendar_sync_logs')
      .update({
        ...results,
        sync_completed_at: new Date().toISOString(),
      })
      .eq('id', syncLogId);
  }
}

/**
 * Main sync function
 */
export async function syncUserCalendarData(
  userId: string,
  supabaseClient: SupabaseClient,
  options: CalendarSyncOptions = {
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
    endDate: new Date(), // Today
    maxResults: 250,
    includeDeclined: false,
    singleEvents: true,
  }
): Promise<SyncResults> {
  const service = new GoogleCalendarService(supabaseClient);
  
  // Create sync log
  const syncLogId = await service.createSyncLog(userId);
  
  try {
    // Get user's integration
    const integration = await service.getUserIntegration(userId);
    if (!integration) {
      throw new Error('No Google Calendar integration found for user');
    }

    // Fetch calendar events
    const events = await service.fetchMeetings(integration, options);
    
    // Match events to contacts
    const eventToContactsMap = await service.matchEventsToContacts(events, userId);
    
    // Create meeting artifacts
    const { created, errors } = await service.createMeetingArtifacts(
      eventToContactsMap,
      events,
      userId
    );

    // Get updated contact IDs
    const contactsUpdated = Array.from(eventToContactsMap.values())
      .flat()
      .map(match => match.contactId)
      .filter((id, index, arr) => arr.indexOf(id) === index); // unique

    const results: SyncResults = {
      success: true,
      eventsProcessed: events.length,
      artifactsCreated: created,
      contactsUpdated,
      errors: errors.map(e => ({
        eventId: e.eventId,
        error: e.error,
        timestamp: new Date().toISOString(),
      })),
      syncLogId,
    };

    // Update sync log
    await service.updateSyncLog(syncLogId, {
      status: 'completed',
      events_processed: events.length,
      artifacts_created: created,
      contacts_updated: contactsUpdated,
      errors: results.errors,
    });

    return results;
  } catch (error) {
    // Update sync log with error
    await service.updateSyncLog(syncLogId, {
      status: 'failed',
      errors: [{
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }],
    });

    throw error;
  }
} 