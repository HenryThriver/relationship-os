'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { Json } from '@/lib/supabase/database.types';

// ===============================================
// TYPES
// ===============================================

interface CreateSessionAction {
  type: 'add_contact' | 'add_meeting_notes';
  goal_id?: string;
  meeting_artifact_id?: string;
  contact_id?: string;
}

// interface SessionAction {
//   id: string;
//   session_id: string;
//   action_type: string;
//   status: string;
//   contact_id?: string;
//   goal_id?: string;
//   meeting_artifact_id?: string;
//   action_data: Record<string, unknown>;
//   completed_at?: string;
//   created_at: string;
//   // Relations
//   contact?: {
//     id: string;
//     name: string;
//     goal_id?: string;
//   };
//   meeting_artifact?: {
//     id: string;
//     metadata: Record<string, unknown>;
//     created_at: string;
//   };
// }

// interface RelationshipSession {
//   id: string;
//   user_id: string;
//   session_type: string;
//   status: string;
//   started_at: string;
//   completed_at?: string;
//   created_at: string;
//   actions: SessionAction[];
// }

// ===============================================
// GOALS FOR RELATIONSHIP BUILDING
// ===============================================

export function useGoalsForRelationshipBuilding() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['goals-relationship-building', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get all active goals with their contact counts and meeting data
      const { data: goals, error } = await supabase
        .from('goals')
        .select(`
          *,
          goal_contacts(
            contact_id,
            contacts!inner(id, name, email)
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (error) throw error;
      
      // Calculate relationship building opportunities for each goal
      const goalsWithOpportunities = await Promise.all(
        (goals || []).map(async (goal) => {
          const contacts = goal.goal_contacts || [];
          const currentCount = contacts.length;
          const targetCount = goal.target_contact_count || 50;
          const needsContacts = currentCount < targetCount;
          
          // Check for meetings needing notes within this goal's contacts
          const contactIds = contacts.map(gc => gc.contact_id);
          let meetingsNeedingNotes = 0;
          
          if (contactIds.length > 0) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const { data: meetings } = await supabase
              .from('artifacts')
              .select('id, content, contact_id')
              .eq('type', 'meeting')
              .in('contact_id', contactIds)
              .gte('created_at', thirtyDaysAgo.toISOString());
            
            // Count meetings without substantial notes/transcript/recording
            meetingsNeedingNotes = (meetings || []).filter(meeting => {
              let meetingContent: Record<string, unknown> = {};
              try {
                meetingContent = typeof meeting.content === 'string' 
                  ? JSON.parse(meeting.content) 
                  : meeting.content || {};
              } catch {
                meetingContent = {};
              }
              
              const hasNotes = (meetingContent as { notes?: string }).notes && (meetingContent as { notes: string }).notes.trim().length > 20;
              const hasTranscript = (meetingContent as { transcript?: string }).transcript && (meetingContent as { transcript: string }).transcript.trim().length > 50;
              const hasRecording = (meetingContent as { recording_url?: string }).recording_url;
              
              return !hasNotes && !hasTranscript && !hasRecording;
            }).length;
          }
          
          // Calculate total opportunities
          const totalOpportunities = (needsContacts ? 1 : 0) + meetingsNeedingNotes;
          
          return {
            ...goal,
            current_contact_count: currentCount,
            target_contact_count: targetCount,
            needs_contacts: needsContacts,
            meetings_needing_notes: meetingsNeedingNotes,
            total_opportunities: totalOpportunities,
            contacts: contacts.map(gc => gc.contacts)
          };
        })
      );
      
      // Return goals with opportunities, sorted by most opportunities first
      return goalsWithOpportunities
        .filter(goal => goal.total_opportunities > 0)
        .sort((a, b) => b.total_opportunities - a.total_opportunities);
    },
    enabled: !!user
  });
}

// ===============================================
// MEETINGS NEEDING NOTES
// ===============================================

export function useMeetingsNeedingNotes() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['meetings-needing-notes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get meetings from last 30 days that may need context
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: meetings, error } = await supabase
        .from('artifacts')
        .select(`
          id, contact_id, metadata, created_at, content,
          contacts!inner(id, name, goal_id)
        `)
        .eq('type', 'meeting')
        .eq('contacts.user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filter meetings that need additional context
      const meetingsNeedingNotes = [];
      for (const meeting of meetings || []) {
        // Parse meeting content to check for existing notes/transcript
        let meetingContent: unknown = {};
        try {
          meetingContent = typeof meeting.content === 'string' 
            ? JSON.parse(meeting.content) 
            : meeting.content || {};
        } catch {
          meetingContent = {};
        }
        
        // Check if meeting has minimal context
        const hasNotes = (meetingContent as { notes?: string }).notes && (meetingContent as { notes: string }).notes.trim().length > 20;
        const hasTranscript = (meetingContent as { transcript?: string }).transcript && (meetingContent as { transcript: string }).transcript.trim().length > 50;
        const hasRecording = (meetingContent as { recording_url?: string }).recording_url;
        
        // Meeting needs notes if it lacks substantial context
        if (!hasNotes && !hasTranscript && !hasRecording) {
          meetingsNeedingNotes.push({
            id: meeting.id,
            contact_id: meeting.contact_id,
            metadata: meeting.metadata,
            created_at: meeting.created_at,
            contacts: meeting.contacts
          });
        }
      }
      
      return meetingsNeedingNotes.slice(0, 5); // Limit to 5 most recent
    },
    enabled: !!user
  });
}

// ===============================================
// AVAILABLE SESSION ACTIONS
// ===============================================

// ===============================================
// GOAL-SPECIFIC SESSION ACTIONS
// ===============================================

export function useGoalSessionActions(goalId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['goal-session-actions', goalId, user?.id],
    queryFn: async () => {
      if (!user || !goalId) return [];
      
      const actions: unknown[] = [];
      
      // Get goal details with contacts
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select(`
          *,
          goal_contacts(
            contact_id,
            contacts!inner(id, name, email)
          )
        `)
        .eq('id', goalId)
        .eq('user_id', user.id)
        .single();

      if (goalError || !goal) return [];
      
      const contacts = goal.goal_contacts || [];
      const currentCount = contacts.length;
      const targetCount = goal.target_contact_count || 50;
      
      // Always include "add contact" action if below target
      if (currentCount < targetCount) {
        actions.push({
          type: 'add_contact',
          goal_id: goalId,
          goal_title: goal.title,
          current_count: currentCount,
          target_count: targetCount
        });
      }
      
      // 1. Get orphaned session actions (created during calendar sync)
      const { data: orphanedActions, error: orphanedError } = await supabase
        .from('session_actions')
        .select(`
          id, action_type, contact_id, meeting_artifact_id, action_data, created_at,
          contacts(id, name),
          artifacts!meeting_artifact_id(id, metadata, created_at)
        `)
        .eq('user_id', user.id)
        .eq('goal_id', goalId)
        .eq('status', 'pending')
        .is('session_id', null) // Only orphaned actions
        .order('created_at', { ascending: false });

      if (orphanedError) {
        console.error('Error fetching orphaned actions:', orphanedError);
      } else {
        // Add orphaned actions to the actions list
        (orphanedActions || []).forEach(action => {
          const contactData = action.contacts as unknown;
          const artifactData = action.artifacts as unknown;
          const actionData = action.action_data as unknown;
          
          actions.push({
            type: action.action_type,
            session_action_id: action.id, // Track the existing session action
            meeting_artifact_id: action.meeting_artifact_id,
            contact_id: action.contact_id,
            contact_name: (contactData as { name?: string })?.name || 'Unknown Contact',
            meeting_title: (actionData as { meeting_title?: string })?.meeting_title || (artifactData as { metadata?: { title?: string } })?.metadata?.title || 'Meeting',
            meeting_date: (artifactData as { created_at?: string })?.created_at || action.created_at,
            created_from: (actionData as { created_from?: string })?.created_from || 'orphaned'
          });
        });
      }
      
      // 2. Find additional meetings needing notes for this goal's contacts (fallback)
      if (contacts.length > 0) {
        const contactIds = contacts.map((gc: unknown) => (gc as { contact_id: string }).contact_id);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: meetings, error: meetingsError } = await supabase
          .from('artifacts')
          .select(`
            id, content, contact_id, metadata, created_at,
            contacts(id, name)
          `)
          .eq('type', 'meeting')
          .in('contact_id', contactIds)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (meetingsError) {
          console.error('Error fetching meetings:', meetingsError);
        } else {
          // Filter meetings that need notes and aren't already covered by orphaned actions
          const existingMeetingIds = new Set(
            (orphanedActions || []).map(action => action.meeting_artifact_id).filter(Boolean)
          );
          
          (meetings || []).forEach(meeting => {
            // Skip if already covered by orphaned action
            if (existingMeetingIds.has(meeting.id)) return;
            
            let meetingContent: unknown = {};
            let hasStructuredContent = false;
            
            try {
              if (typeof meeting.content === 'string') {
                meetingContent = JSON.parse(meeting.content);
                hasStructuredContent = true;
              } else {
                meetingContent = meeting.content || {};
                hasStructuredContent = true;
              }
            } catch {
              meetingContent = {};
              hasStructuredContent = false;
            }
            
            let needsNotes = false;
            
            if (hasStructuredContent) {
              const hasNotes = (meetingContent as { notes?: string }).notes && (meetingContent as { notes: string }).notes.trim().length > 20;
              const hasTranscript = (meetingContent as { transcript?: string }).transcript && (meetingContent as { transcript: string }).transcript.trim().length > 50;
              const hasRecording = (meetingContent as { recording_url?: string }).recording_url;
              needsNotes = !hasNotes && !hasTranscript && !hasRecording;
            } else {
              const contentStr = typeof meeting.content === 'string' ? meeting.content : '';
              needsNotes = contentStr.length < 100;
            }
            
            if (needsNotes) {
              const meetingMetadata = meeting.metadata as unknown;
              const contactData = meeting.contacts as unknown;
              
              actions.push({
                type: 'add_meeting_notes',
                meeting_artifact_id: meeting.id,
                contact_id: meeting.contact_id,
                contact_name: (contactData as { name?: string })?.name || 'Unknown Contact',
                meeting_title: (meetingMetadata as { title?: string })?.title || 'Meeting',
                meeting_date: meeting.created_at,
                created_from: 'dynamic_detection'
              });
            }
          });
        }
      }
      
      return actions;
    },
    enabled: !!user && !!goalId
  });
}

// ===============================================
// SESSION MANAGEMENT
// ===============================================

export function useCreateSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (params: { 
      goalId: string; 
      durationMinutes: number; 
      actions: CreateSessionAction[] 
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Create session
      const { data: session, error } = await supabase
        .from('relationship_sessions')
        .insert({ 
          user_id: user.id, 
          session_type: 'goal_focused',
          status: 'active',
          goal_id: params.goalId,
          duration_minutes: params.durationMinutes,
          timer_started_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Handle session actions
      if (params.actions.length > 0) {
        const actionsToCreate: Array<{
          session_id: string;
          user_id: string;
          action_type: string;
          contact_id?: string;
          goal_id?: string;
          meeting_artifact_id?: string;
          action_data: Json | null;
          status: string;
        }> = [];
        const orphanedActionsToUpdate: string[] = [];
        
        for (const action of params.actions) {
          // Check if this action already exists as an orphaned session action
          const actionWithId = action as CreateSessionAction & { session_action_id?: string };
          const isOrphanedAction = actionWithId.session_action_id;
          
          if (isOrphanedAction) {
            // Link existing orphaned action to this session
            orphanedActionsToUpdate.push(actionWithId.session_action_id!);
          } else {
            // Create new session action
            actionsToCreate.push({
              session_id: session.id,
              user_id: user.id,
              action_type: action.type,
              contact_id: action.contact_id,
              goal_id: action.goal_id,
              meeting_artifact_id: action.meeting_artifact_id,
              action_data: {} as Json,
              status: 'pending'
            });
          }
        }
        
        // Update orphaned actions to link them to this session
        if (orphanedActionsToUpdate.length > 0) {
          const { error: updateError } = await supabase
            .from('session_actions')
            .update({ session_id: session.id })
            .in('id', orphanedActionsToUpdate);
          
          if (updateError) {
            console.error('Error linking orphaned actions to session:', updateError);
            throw updateError;
          }
        }
        
        // Create new session actions
        if (actionsToCreate.length > 0) {
          const { error: actionsError } = await supabase
            .from('session_actions')
            .insert(actionsToCreate);
          
          if (actionsError) {
            console.error('Error creating new session actions:', actionsError);
            throw actionsError;
          }
        }
      }
      
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['goal-session-actions'] });
    }
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['relationship-session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_sessions')
        .select(`
          *,
          goal:goals(
            id, title, description, target_contact_count,
            goal_contacts(
              contact_id,
              contacts!inner(id, name, email)
            )
          ),
          actions:session_actions(
            *,
            contact:contacts(id, name, profile_picture),
            meeting_artifact:artifacts!meeting_artifact_id(id, metadata, created_at),
            goal:goals(
              id, title, description, target_contact_count,
              goal_contacts(
                contact_id,
                contacts!inner(id, name, email)
              )
            )
          )
        `)
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      return data as unknown; // Type assertion to avoid complex type issues
    },
    enabled: !!sessionId
  });
}

export function useCompleteSessionAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      actionId, 
      status, 
      actionData 
    }: { 
      actionId: string; 
      status: 'completed' | 'skipped'; 
      actionData?: Record<string, unknown>;
    }) => {
      const { error } = await supabase
        .from('session_actions')
        .update({
          status,
          action_data: (actionData || {}) as Json,
          completed_at: new Date().toISOString()
        })
        .eq('id', actionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate session queries
      queryClient.invalidateQueries({ 
        queryKey: ['relationship-session'],
        predicate: (query) => {
          // Invalidate unknown session query since we don't know which session this action belongs to
          return query.queryKey[0] === 'relationship-session';
        }
      });
    }
  });
} 