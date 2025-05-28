import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/client';
import type { 
  GoogleCalendarEvent, 
  ContactEmailMatch, 
  SyncResults, 
  CalendarSyncOptions,
  UserIntegration,
  CalendarSyncLog
} from '@/types/calendar';
import type { MeetingArtifactMetadata } from '@/types/artifact';

export class GoogleCalendarService {
  private supabase = createClient();

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
  private async createOAuth2Client(integration: UserIntegration) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/callback`
    );

    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expiry_date: integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : undefined,
    });

    // Handle token refresh
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        await this.updateIntegrationTokens(integration.id, tokens);
      }
    });

    return oauth2Client;
  }

  /**
   * Update integration tokens after refresh
   */
  private async updateIntegrationTokens(integrationId: string, tokens: any): Promise<void> {
    const updateData: any = {
      access_token: tokens.access_token,
      updated_at: new Date().toISOString(),
    };

    if (tokens.refresh_token) {
      updateData.refresh_token = tokens.refresh_token;
    }

    if (tokens.expiry_date) {
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
    const oauth2Client = await this.createOAuth2Client(integration);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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
        .filter(event => {
          if (!event.attendees || event.attendees.length === 0) return false;
          if (!options.includeDeclined && event.status === 'cancelled') return false;
          return true;
        })
        .map(event => ({
          id: event.id!,
          summary: event.summary,
          description: event.description,
          start: {
            dateTime: event.start?.dateTime,
            date: event.start?.date,
            timeZone: event.start?.timeZone,
          },
          end: {
            dateTime: event.end?.dateTime,
            date: event.end?.date,
            timeZone: event.end?.timeZone,
          },
          attendees: event.attendees?.map(attendee => ({
            email: attendee.email!,
            displayName: attendee.displayName,
            responseStatus: attendee.responseStatus as any,
            self: attendee.self,
            organizer: attendee.organizer,
          })),
          organizer: event.organizer ? {
            email: event.organizer.email!,
            displayName: event.organizer.displayName,
            self: event.organizer.self,
          } : undefined,
          location: event.location,
          htmlLink: event.htmlLink,
          hangoutLink: event.hangoutLink,
          conferenceData: event.conferenceData ? {
            entryPoints: event.conferenceData.entryPoints?.map(ep => ({
              entryPointType: ep.entryPointType!,
              uri: ep.uri!,
              label: ep.label,
            })),
            conferenceSolution: event.conferenceData.conferenceSolution ? {
              name: event.conferenceData.conferenceSolution.name!,
              iconUri: event.conferenceData.conferenceSolution.iconUri,
            } : undefined,
            conferenceId: event.conferenceData.conferenceId,
          } : undefined,
          recurringEventId: event.recurringEventId,
          created: event.created,
          updated: event.updated,
          status: event.status as any,
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
    // Get all user's contacts
    const { data: contacts, error } = await this.supabase
      .from('contacts')
      .select('id, name, email')
      .eq('user_id', userId);

    if (error || !contacts) {
      throw new Error(`Failed to fetch contacts: ${error?.message}`);
    }

    const eventToContactsMap = new Map<string, ContactEmailMatch[]>();

    for (const event of events) {
      const matches: ContactEmailMatch[] = [];
      
      if (event.attendees) {
        for (const attendee of event.attendees) {
          // Skip self (the user)
          if (attendee.self) continue;

          // Find exact email matches
          const exactMatch = contacts.find(contact => 
            contact.email && contact.email.toLowerCase() === attendee.email.toLowerCase()
          );

          if (exactMatch) {
            matches.push({
              contactId: exactMatch.id,
              contactName: exactMatch.name || 'Unknown',
              contactEmail: exactMatch.email!,
              matchedEmail: attendee.email,
              confidence: 'exact',
            });
            continue;
          }

          // Find domain matches (same company)
          const attendeeDomain = attendee.email.split('@')[1];
          const domainMatch = contacts.find(contact => {
            if (!contact.email) return false;
            const contactDomain = contact.email.split('@')[1];
            return contactDomain === attendeeDomain;
          });

          if (domainMatch) {
            matches.push({
              contactId: domainMatch.id,
              contactName: domainMatch.name || 'Unknown',
              contactEmail: domainMatch.email!,
              matchedEmail: attendee.email,
              confidence: 'domain',
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
        const endDate = event.end.dateTime || event.end.date;
        
        let durationMinutes: number | undefined;
        if (event.start.dateTime && event.end.dateTime) {
          const start = new Date(event.start.dateTime);
          const end = new Date(event.end.dateTime);
          durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        }

        const metadata: MeetingArtifactMetadata = {
          title: event.summary,
          attendees: event.attendees?.map(a => a.displayName || a.email) || [],
          meeting_date: meetingDate,
          location: event.location,
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
        const { data: existingArtifact } = await this.supabase
          .from('artifacts')
          .select('id')
          .eq('contact_id', primaryMatch.contactId)
          .eq('type', 'meeting')
          .eq('metadata->>google_calendar_id', event.id)
          .single();

        if (existingArtifact) {
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
          await this.supabase
            .from('artifacts')
            .insert({
              contact_id: primaryMatch.contactId,
              user_id: userId,
              type: 'meeting',
              content: event.summary || 'Meeting',
              metadata,
              timestamp: meetingDate,
            });
          
          created++;
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
  options: CalendarSyncOptions = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    maxResults: 250,
    includeDeclined: false,
    singleEvents: true,
  }
): Promise<SyncResults> {
  const service = new GoogleCalendarService();
  
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