// Shared Google Calendar Service for Edge Functions
// File: supabase/functions/_shared/google-calendar-service.ts

import { google } from 'npm:googleapis@134';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    self?: boolean;
    organizer?: boolean;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: any;
  recurringEventId?: string;
  created?: string;
  updated?: string;
  status?: string;
}

export interface ContactEmailMatch {
  contactId: string;
  contact: any;
  matchedEmails: string[];
  confidence: number;
}

export interface UserIntegration {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  metadata?: Record<string, any>;
}

export interface CalendarSyncOptions {
  startDate: Date;
  endDate: Date;
  maxResults?: number;
  includeDeclined?: boolean;
  singleEvents?: boolean;
}

export class GoogleCalendarService {
  private supabase: any;

  constructor(supabaseClient: any) {
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
  private async createOAuth2Client(integration: UserIntegration) {
    const oauth2Client = new google.auth.OAuth2(
      Deno.env.get('GOOGLE_CLIENT_ID'),
      Deno.env.get('GOOGLE_CLIENT_SECRET'),
      `${Deno.env.get('NEXT_PUBLIC_SITE_URL')}/api/calendar/callback`
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
          summary: event.summary || undefined,
          description: event.description || undefined,
          start: {
            dateTime: event.start?.dateTime || undefined,
            date: event.start?.date || undefined,
            timeZone: event.start?.timeZone || undefined,
          },
          end: {
            dateTime: event.end?.dateTime || undefined,
            date: event.end?.date || undefined,
            timeZone: event.end?.timeZone || undefined,
          },
          attendees: event.attendees?.map(attendee => ({
            email: attendee.email!,
            displayName: attendee.displayName || undefined,
            responseStatus: attendee.responseStatus as any,
            self: attendee.self || undefined,
            organizer: attendee.organizer || undefined,
          })),
          organizer: event.organizer ? {
            email: event.organizer.email!,
            displayName: event.organizer.displayName,
            self: event.organizer.self,
          } : undefined,
          location: event.location || undefined,
          htmlLink: event.htmlLink || undefined,
          hangoutLink: event.hangoutLink || undefined,
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
          name: contact.name,
          email: contact.email,
        });
      }
      
      // Add emails from email_addresses array
      if (contact.email_addresses && Array.isArray(contact.email_addresses)) {
        contact.email_addresses.forEach(email => {
          if (email) {
            emailToContactMap.set(email.toLowerCase(), {
              id: contact.id,
              name: contact.name,
              email: email,
            });
          }
        });
      }
    });

    // Add emails from contact_emails table
    if (contactEmails) {
      contactEmails.forEach(ce => {
        const contact = contacts.find(c => c.id === ce.contact_id);
        if (contact) {
          emailToContactMap.set(ce.email.toLowerCase(), {
            id: contact.id,
            name: contact.name,
            email: contact.email || ce.email,
          });
        }
      });
    }

    // Match events to contacts
    const eventToContactsMap = new Map<string, ContactEmailMatch[]>();

    events.forEach(event => {
      const matches: ContactEmailMatch[] = [];
      const processedContacts = new Set<string>();

      event.attendees?.forEach(attendee => {
        const contact = emailToContactMap.get(attendee.email.toLowerCase());
        if (contact && !processedContacts.has(contact.id)) {
          matches.push({
            contactId: contact.id,
            contact: contact,
            matchedEmails: [attendee.email],
            confidence: 1.0, // Exact email match
          });
          processedContacts.add(contact.id);
        }
      });

      if (matches.length > 0) {
        eventToContactsMap.set(event.id, matches);
      }
    });

    return eventToContactsMap;
  }

  /**
   * Create meeting artifacts for matched events
   */
  async createMeetingArtifacts(
    eventToContactsMap: Map<string, ContactEmailMatch[]>,
    events: GoogleCalendarEvent[],
    userId: string
  ): Promise<{ created: number; errors: Array<{ eventId: string; error: string }> }> {
    let created = 0;
    const errors: Array<{ eventId: string; error: string }> = [];

    for (const [eventId, matches] of eventToContactsMap) {
      const event = events.find(e => e.id === eventId);
      if (!event || matches.length === 0) continue;

      // Use the first match as primary (highest confidence)
      const primaryMatch = matches[0];

      try {
        const meetingDate = event.start.dateTime || event.start.date;
        const endDate = event.end.dateTime || event.end.date;
        
        let durationMinutes: number | undefined;
        if (event.start.dateTime && event.end.dateTime) {
          const start = new Date(event.start.dateTime);
          const end = new Date(event.end.dateTime);
          durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        }

        const metadata: any = {
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
          const { data: artifact, error: artifactError } = await this.supabase
            .from('artifacts')
            .insert({
              user_id: userId,
              contact_id: primaryMatch.contactId,
              type: 'meeting',
              content: event.summary || 'Meeting',
              timestamp: meetingDate,
              ai_parsing_status: 'pending',
              metadata,
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
  async createSyncLog(userId: string, metadata: any = {}): Promise<string> {
    const { data, error } = await this.supabase
      .from('calendar_sync_logs')
      .insert({
        user_id: userId,
        status: 'in_progress',
        metadata,
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
    results: any
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
 * Enhanced sync function with date range support for nightly sync
 */
export async function syncUserCalendarDataWithRange(
  userId: string,
  supabaseClient: any,
  options: {
    lookbackDays: number;
    lookforwardDays: number;
    integration?: UserIntegration;
  }
): Promise<{
  eventsProcessed: number;
  artifactsCreated: number;
  contactsUpdated: string[];
  syncLogId: string;
}> {
  const service = new GoogleCalendarService(supabaseClient);
  
  // Calculate date range
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - options.lookbackDays);
  
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + options.lookforwardDays);

  // Create sync log
  const syncLogId = await service.createSyncLog(userId, {
    sync_type: 'nightly',
    date_range: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      lookbackDays: options.lookbackDays,
      lookforwardDays: options.lookforwardDays,
    }
  });

  try {
    // Get user's integration if not provided
    const integration = options.integration || await service.getUserIntegration(userId);
    if (!integration) {
      throw new Error('No Google Calendar integration found for user');
    }

    // Fetch calendar events
    const events = await service.fetchMeetings(integration, {
      startDate,
      endDate,
      maxResults: 250,
      includeDeclined: false,
      singleEvents: true,
    });
    
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

    // Update sync log
    await service.updateSyncLog(syncLogId, {
      status: 'completed',
      events_processed: events.length,
      artifacts_created: created,
      contacts_updated: contactsUpdated,
      errors: errors.map(e => ({
        eventId: e.eventId,
        error: e.error,
        timestamp: new Date().toISOString(),
      })),
    });

    return {
      eventsProcessed: events.length,
      artifactsCreated: created,
      contactsUpdated,
      syncLogId,
    };

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