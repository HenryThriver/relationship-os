Created: 5/27/2025
Last update: 5/27/2025

# index.md

## src/app

### layout.tsx

- **Purpose:** Root layout for the Next.js App Router. Sets up global fonts, metadata, and providers.
- **Imports:**
  - `Metadata` from Next.js for static site metadata.
  - Google fonts (`Geist`, `Geist_Mono`).
  - Global CSS.
  - `AppProviders` (wraps the app in context providers).
- **Font Setup:** Loads Geist Sans and Mono, sets CSS variables.
- **Metadata:** Sets app title and description.
- **Interface:**  
  ```ts
  interface RootLayoutProps {
    children: React.ReactNode;
  }
  ```
- **Component:**  
  ```ts
  export default function RootLayout({ children }: RootLayoutProps)
  ```
  - Renders `<html lang="en">` and `<body>` with font variables and antialiasing.
  - Wraps children in `<AppProviders>`.
  - Handles hydration warning suppression for browser extension compatibility.
- **Notes:**  
  - Head tag is managed by Next.js.
  - DashboardLayout could be conditionally rendered here or in route groups.

---

### page.tsx

- **Purpose:** Home page, client-side only. Handles initial user routing.
- **Imports:**
  - React, useEffect.
  - Next.js router.
  - MUI: Box, CircularProgress, Typography.
  - `useAuth` context.
- **Component:**  
  ```ts
  export default function HomePage(): React.JSX.Element
  ```
  - Uses `useAuth` to get user and loading state.
  - On mount, redirects:
    - If authenticated: `/dashboard`
    - If not: `/auth/login`
  - Shows loading spinner and "Loading Relationship OS..." message while redirecting.

---

### globals.css

- **Purpose:** Global CSS and Tailwind integration.
- **Key Styles:**
  - Imports Tailwind.
  - Sets CSS variables for background, foreground, and fonts.
  - Handles dark mode with `prefers-color-scheme`.
  - Applies background, color, and font-family to `body`.

---

### favicon.ico

- **Purpose:** Application favicon.
- **Note:** Binary file, not human-readable.

---

### auth/callback/page.tsx

- **Purpose:** Handles Supabase OAuth callback, manages session, redirects, and error display.
- **Imports:**
  - React, useEffect, useState.
  - Next.js router.
  - MUI: Box, CircularProgress, Typography, Alert, Container.
  - Supabase client.
- **Component:**  
  ```ts
  export default function AuthCallbackPage(): React.JSX.Element
  ```
  - On mount, checks for Supabase session:
    - If session: redirects to `/dashboard`
    - If no session: redirects to `/auth/login`
    - If error: displays error alert
  - Shows loading spinner and "Completing authentication..." message while processing.

---

### auth/login/page.tsx

- **Purpose:** Login page, handles Google OAuth sign-in via Supabase.
- **Imports:**
  - React, useState, useEffect.
  - Next.js router.
  - MUI: Box, Button, Card, CardContent, Typography, Alert, CircularProgress, Container.
  - MUI Icon: Google.
  - `useAuth` context.
- **Component:**  
  ```ts
  export default function LoginPage(): React.JSX.Element
  ```
  - Uses `useAuth` for user and sign-in method.
  - If already authenticated, redirects to `/dashboard`.
  - Handles Google sign-in, shows loading and error states.
  - Renders a styled card with Google sign-in button and legal text.

---

## src/app/dashboard

### layout.tsx

- **Purpose:** Wraps all dashboard pages in authentication and dashboard layout.
- **Imports:**
  - `ProtectedRoute` (guards dashboard routes for authenticated users)
  - `DashboardLayout` (provides dashboard UI structure)
- **Interface:**
  ```ts
  interface DashboardLayoutProps {
    children: React.ReactNode;
  }
  ```
- **Component:**
  ```ts
  export default function Layout({ children }: DashboardLayoutProps): React.JSX.Element
  ```
  - Wraps children in `<ProtectedRoute>` and `<DashboardLayout>`.
  - Ensures all dashboard content is protected and consistently styled.

---

### page.tsx

- **Purpose:** Main dashboard landing page, shows user greeting and stats.
- **Imports:**
  - MUI: Box, Typography, Card, CardContent, Paper
  - MUI Icons: People, Timeline, TrendingUp
  - `useAuth` context
- **Component:**
  ```ts
  export default function DashboardPage(): React.JSX.Element
  ```
  - Greets user by first name (from Supabase user metadata).
  - Displays three stat cards: Total Contacts, Recent Interactions, Active Loops (all currently hardcoded to 0).
  - Shows "Recent Activity" and "Quick Actions" panels (placeholders for future features).

---

#### contacts/page.tsx

- **Purpose:** Lists all contacts, allows adding new contacts.
- **Imports:**
  - MUI: Box, Typography, Paper, Button, List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, Alert, Divider
  - MUI Icons: Add, ChevronRight
  - Next.js Link
  - `useContacts` hook
  - `Contact` type
- **Component:**
  ```ts
  export default function ContactsPage(): React.JSX.Element
  ```
  - Fetches contacts, loading, and error state from `useContacts`.
  - Shows loading spinner, error alert, or list of contacts.
  - Each contact is a clickable list item linking to their detail page.
  - If no contacts, shows a call-to-action to add the first contact.

---

#### contacts/new/page.tsx

- **Purpose:** Add a new contact via LinkedIn import.
- **Imports:**
  - React, useState, useEffect
  - MUI: Container, Typography, Paper, Box, Alert, CircularProgress, Button, Link
  - Next.js router and Link
  - `useAuth` context
  - `LinkedInImportForm` component
  - Types: `LinkedInImportApiResponse`, `RapidLinkedInProfile`, `TablesInsert`
  - `useContacts` and `useArtifacts` hooks
- **Component:**
  ```ts
  export default function NewContactPage(): React.ReactElement
  ```
  - Handles LinkedIn profile import, review, and confirmation.
  - On successful import, creates a new contact and a LinkedIn profile artifact.
  - Shows loading, error, and success states.
  - Renders a review section for imported profile data before saving.

---

#### contacts/[id]/layout.tsx

- **Purpose:** Layout for individual contact pages, provides navigation tabs.
- **Imports:**
  - React
  - MUI: Box, Container, Tabs, Tab
  - Next.js: useParams, usePathname, useRouter
- **Component:**
  ```ts
  export default function ContactLayout({ children }: { children: React.ReactNode })
  ```
  - Determines current tab (Overview, Timeline) based on URL.
  - Renders navigation tabs and the child page content.

---

#### contacts/[id]/page.tsx

- **Purpose:** Main profile page for a contact, shows all relationship intelligence and actions.
- **Imports:**
  - React, useState, useEffect, useCallback, useMemo
  - MUI: Container, Box, Typography, Paper, CircularProgress, Alert, List, ListItemText, ListItemButton, Button
  - Next.js: useParams, useSearchParams, useRouter
  - Supabase client
  - Next.js dynamic import
  - TanStack Query: useQueryClient
  - Many feature components: ContactHeader, NextConnection, ActionQueues, ReciprocityDashboard, ContextSections, QuickAdd, ArtifactModal, VoiceRecorder, SuggestionsPanel, VoiceMemoDetailModal, ProcessingIndicator, ProcessingStatusBar
  - Many hooks: useContactProfile, useVoiceMemos, useUpdateSuggestions, useArtifacts, useArtifactModalData
  - Types: ArtifactGlobal, POGArtifactContent, AskArtifactContent, POGArtifactContentStatus, AskArtifactContentStatus, PersonalContext, VoiceMemoArtifact
  - Toast context
- **Component:**
  ```ts
  const ContactProfilePage: React.FC<ContactProfilePageProps> = () => { ... }
  export default ContactProfilePage;
  ```
  - Handles all data fetching, state, and event logic for a contact's profile.
  - Integrates voice memos, suggestions, action queues, quick add, and artifact modals.
  - Handles real-time updates via Supabase channels.
  - Provides full relationship intelligence workflow for a contact.

---

#### contacts/[id]/timeline/page.tsx

- **Purpose:** Shows the artifact timeline for a contact.
- **Imports:**
  - React
  - Next.js: useParams
  - MUI: Container, Box, Typography, CircularProgress, Alert
  - ArtifactTimeline, ContactHeader
  - useContactProfile hook
  - useMemo
  - PersonalContext type
- **Component:**
  ```ts
  export default function ContactTimelinePage()
  ```
  - Fetches contact and personal context.
  - Shows loading, error, or not found states.
  - Renders ContactHeader and ArtifactTimeline for the contact.

---

## src/app/api

### artifacts/[id]/route.ts

- **Purpose:** API route to delete an artifact by ID, with ownership and source checks.
- **Imports:**
  - Next.js: NextRequest, NextResponse
  - Supabase server client
- **Handler:**
  ```ts
  export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> })
  ```
  - Authenticates user
  - Fetches artifact, checks ownership
  - Checks if artifact is a source for contact fields or suggestions
  - Deletes artifact from DB and, if a voice memo, from storage
  - Returns appropriate status and error messages

---

### linkedin/rescrape/route.ts

- **Purpose:** API route to re-scrape a LinkedIn profile for a contact and create a new artifact.
- **Imports:**
  - Next.js: NextRequest, NextResponse
  - Supabase server client
  - Types: RapidLinkedInProfile, LinkedInImportApiResponse, LinkedInDate, LinkedInArtifactContent
- **Handler:**
  ```ts
  export async function POST(req: NextRequest): Promise<NextResponse<LinkedInImportApiResponse>>
  ```
  - Authenticates user
  - Validates request body (contactId, linkedinUrl)
  - Verifies contact ownership
  - Calls RapidAPI to fetch LinkedIn data
  - Transforms and stores data as a new artifact
  - Returns new artifact and raw data

---

### linkedin/import/route.ts

- **Purpose:** API route to import a LinkedIn profile via RapidAPI.
- **Imports:**
  - Next.js: NextRequest, NextResponse
  - Types: LinkedInImportApiRequestBody, RapidLinkedInProfile, LinkedInImportApiResponse
- **Handler:**
  ```ts
  export async function POST(req: NextRequest): Promise<NextResponse<LinkedInImportApiResponse>>
  ```
  - Validates API keys and request body
  - Validates LinkedIn URL
  - Calls RapidAPI to fetch profile data
  - Returns profile data and raw response

---

### suggestions/apply/route.ts

- **Purpose:** API route to apply selected contact update suggestions to a contact, with granular source tracking.
- **Imports:**
  - Next.js: NextRequest, NextResponse
  - Supabase server client
  - Types: ContactUpdateSuggestion, UpdateSuggestionRecord, Database, Json
- **Helpers:**
  - `setValueAtPath(obj, path, value, action)`: Sets, updates, or removes a value at a nested path, handling arrays and objects.
  - `arrayFieldPaths`: Set of known array field paths for context fields.
- **Handler:**
  ```ts
  export async function POST(request: NextRequest)
  ```
  - Validates input (suggestionId, selectedPaths)
  - Fetches suggestion and associated contact
  - Deep clones contact, ensures context fields are objects
  - Applies selected suggestions to contact fields using `setValueAtPath`
  - Tracks source artifact for each updated field
  - Updates contact and suggestion status in DB
  - Returns success or error

---

### voice-memo/[id]/reprocess/route.ts

- **Purpose:** API route to re-trigger AI parsing for a voice memo artifact.
- **Imports:**
  - Next.js: NextRequest, NextResponse
  - Supabase server client
- **Handler:**
  ```ts
  export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> })
  ```
  - Authenticates and validates artifact ID
  - Fetches artifact, checks type and status
  - Updates artifact to set AI parsing status to 'pending'
  - Invokes the 'parse-voice-memo' Edge Function
  - Returns status and error messages

---

### voice-memo/[id]/delete/route.ts

- **Purpose:** API route to delete a voice memo artifact and its storage file, with suggestion checks.
- **Imports:**
  - Next.js: NextRequest, NextResponse
  - Supabase server client
- **Handler:**
  ```ts
  export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> })
  ```
  - Checks for approved/partial suggestions for the artifact
  - Fetches artifact, checks type
  - Deletes artifact from DB and associated audio file from storage
  - Returns status and error messages

---

## src/components/features/contacts

### ContactHeader.tsx

- **Purpose:** Displays a contact's header information, including name, title, company, location, relationship score, suggestions, and action buttons.
- **Props:**
  ```ts
  interface ContactHeaderProps {
    name?: string | null;
    title?: string | null;
    company?: string | null;
    location?: string | null;
    profilePhotoUrl?: string | null;
    relationshipScore?: number | null;
    personalContext?: PersonalContextType | null;
    connectDate?: Date;
    connectCadence?: string | null;
    suggestionCount?: number;
    suggestionPriority?: 'high' | 'medium' | 'low';
    hasNewSuggestions?: boolean;
    onViewSuggestions?: () => void;
    onRecordNote?: () => void;
    onSendPOG?: () => void;
    onScheduleConnect?: () => void;
  }
  ```
- **Component:**
  ```ts
  export const ContactHeader: React.FC<ContactHeaderProps>
  ```
  - Renders avatar, name, title, company, location, relationship score chip, and user goal.
  - Shows suggestion notification badge if suggestions exist.
  - Displays action buttons for "Record Note", "Send POG", and "Schedule Connect".
  - Uses MUI Paper, Box, Stack, Button, Chip, and Avatar for layout and styling.
  - Uses color-coded relationship score bubbles.

---

### ContextSections.tsx

- **Purpose:** Renders the professional and personal context sections for a contact.
- **Props:**
  ```ts
  interface ContextSectionsProps {
    contactData: Contact | null;
    contactId: string;
  }
  ```
- **Component:**
  ```ts
  export const ContextSections: React.FC<ContextSectionsProps>
  ```
  - If no contact data, returns null (parent handles loading state).
  - Extracts and type-casts professional and personal context from contact data.
  - Renders `ProfessionalContextDisplay` and `PersonalContextDisplay` components, passing context and contactId.
  - Designed to replace older granular cards (e.g., FamilyCard, ProfessionalSnapshotCard) with comprehensive context displays.

---

### ProfessionalContext.tsx

- **Purpose:**
  Renders the professional context section for a contact, including current role, company, goals, background, skills, achievements, and more. Integrates source attribution for each field.

- **Props:**
  ```ts
  interface ProfessionalContextProps {
    professionalContext: ProfessionalContext | undefined;
    contactId: string;
  }
  ```

- **Component:**
  ```ts
  export const ProfessionalContextDisplay: React.FC<ProfessionalContextProps>
  ```
  - Renders all professional context fields as lists or text, each wrapped in `SourcedField` for source attribution.
  - Handles array and string fields, and renders them with MUI components.
  - Skips empty fields for a clean UI.

- **Notes:**
  - Used in the main contact profile and context sections.

---

### PersonalContext.tsx

- **Purpose:**
  Renders the personal context section for a contact, including family, interests, values, milestones, anecdotes, communication style, relationship goal, conversation starters, and more. Integrates source attribution for each field.

- **Props:**
  ```ts
  interface PersonalContextProps {
    personalContext: PersonalContext | undefined;
    contactId: string;
  }
  ```

- **Component:**
  ```ts
  export const PersonalContextDisplay: React.FC<PersonalContextProps>
  ```
  - Renders all personal context fields as lists or text, each wrapped in `SourcedField` for source attribution.
  - Handles array and string fields, and renders them with MUI components.
  - Skips empty fields for a clean UI.

- **Notes:**
  - Used in the main contact profile and context sections.

---

### ActionQueues.tsx

- **Purpose:**
  Displays the current queue of POGs (Packets of Generosity) and Asks for a contact, grouped and styled by type. Allows for future status updates and brainstorming actions.

- **Props:**
  ```ts
  interface ActionQueuesProps {
    pogs: ActionItem[];
    asks: ActionItem[];
    onUpdateStatus?: (itemId: string, newStatus: ActionItemStatus, type: 'pog' | 'ask') => void;
    onBrainstormPogs?: () => void;
  }
  ```

- **Component:**
  ```ts
  export const ActionQueues: React.FC<ActionQueuesProps>
  ```
  - Renders two lists: Proposed Generosity (POGs) and Proposed Asks, each with custom styling.
  - Includes a button to brainstorm POGs if handler is provided.
  - Displays quick stats/detailed view placeholder.

- **Notes:**
  - Used in the contact profile page for relationship intelligence.

---

### NextConnection.tsx

- **Purpose:**
  Displays the next scheduled connection for a contact, including agenda items grouped by type (celebrate, open thread, new thread).

- **Props:**
  ```ts
  interface NextConnectionProps {
    contactId: string;
  }
  ```

- **Component:**
  ```ts
  export const NextConnection: React.FC<NextConnectionProps>
  ```
  - Fetches next connection data using `useNextConnection` hook.
  - Renders loading, error, or no-connection states.
  - Displays agenda items with icons and color coding by type.

- **Notes:**
  - Used in the contact profile page and dashboard.

---

### ReciprocityDashboard.tsx

- **Purpose:**
  Visualizes the balance of giving and receiving in the relationship, recent exchanges, and outstanding commitments.

- **Props:**
  ```ts
  interface ReciprocityDashboardProps {
    balance?: number;
    healthIndex?: number;
    status?: 'balanced' | 'over-giving' | 'under-giving' | 'neutral';
    recentExchanges?: ExchangeItem[];
    outstandingCommitments?: { id: string; text: string }[];
  }
  ```

- **Component:**
  ```ts
  export const ReciprocityDashboard: React.FC<ReciprocityDashboardProps>
  ```
  - Shows a progress bar for relationship balance.
  - Lists recent given/received exchanges and outstanding commitments.
  - Uses color coding and MUI Paper for layout.

- **Notes:**
  - Used in the contact profile page for relationship intelligence.

---

### WorkCareerEventsCard.tsx

- **Purpose:**
  Displays a collapsible list of key work and career events for a contact, with icons for event types.

- **Props:**
  ```ts
  interface WorkCareerEventsCardProps {
    events?: EventItem[];
  }
  ```

- **Component:**
  ```ts
  export const WorkCareerEventsCard: React.FC<WorkCareerEventsCardProps>
  ```
  - Renders a list of events with icons and details.
  - Uses a mock list if no events are provided.

- **Notes:**
  - Used in the professional context or timeline.

---

### ProfessionalExpertiseCard.tsx

- **Purpose:**
  Displays a collapsible section of professional expertise tags and key skills for a contact.

- **Props:**
  ```ts
  interface ProfessionalExpertiseCardProps {
    expertiseTags?: string[];
    keySkills?: string[];
  }
  ```

- **Component:**
  ```ts
  export const ProfessionalExpertiseCard: React.FC<ProfessionalExpertiseCardProps>
  ```
  - Renders chips for expertise tags and a comma-separated list for key skills.
  - Uses a mock list if no data is provided.

- **Notes:**
  - Used in the professional context or profile sidebar.

---

### ProfessionalSnapshotCard.tsx

- **Purpose:**
  Displays a collapsible professional snapshot for a contact, including goals, background, ventures, experience, education, LinkedIn, and key skills.

- **Props:**
  ```ts
  interface ProfessionalSnapshotCardProps {
    about?: string | null;
    experience?: ExperienceItem[] | null;
    education?: EducationItem[] | null;
    linkedin_profile_url?: string | null;
    hisGoals?: GoalItem[] | null;
    currentVentures?: VentureItem[] | null;
    keySkills?: string[] | null;
  }
  ```

- **Component:**
  ```ts
  export const ProfessionalSnapshotCard: React.FC<ProfessionalSnapshotCardProps>
  ```
  - Renders all sections as lists or text, with mock data fallback.
  - Includes a LinkedIn profile link if provided.

- **Notes:**
  - Used in the professional context or profile sidebar.

---

### QuickAdd.tsx

- **Purpose:**
  Floating action button for quickly adding notes, meetings, POGs, Asks, or milestones for a contact.

- **Props:**
  ```ts
  interface QuickAddProps {
    onAddNote: () => void;
    onAddMeeting: () => void;
    onAddPOG: () => void;
    onAddAsk: () => void;
    onAddMilestone: () => void;
  }
  ```

- **Component:**
  ```ts
  export const QuickAdd: React.FC<QuickAddProps>
  ```
  - Renders a floating action button that opens a menu of quick-add actions.
  - Each menu item triggers the corresponding handler.

- **Notes:**
  - Used in the contact profile page for fast artifact creation.

---

## src/components/features/timeline

### TimelineFilters.tsx

- **Purpose:**
  Renders filter chips for artifact types, allowing users to filter the timeline. Uses artifact types from config and provides a simple toggle UI.

- **Props:**
  ```ts
  interface TimelineFiltersProps {
    filterTypes: ArtifactType[];
    onFilterChange: (types: ArtifactType[]) => void;
  }
  ```

- **Component:**
  ```ts
  export const TimelineFilters: React.FC<TimelineFiltersProps>
  ```
  - Renders a row of filter chips for each artifact type (from `ALL_ARTIFACT_TYPES`).
  - Handles toggling filters and updates parent state.
  - Uses MUI Box, Typography, and Chip for layout and interaction.

- **Notes:**
  - Used in the timeline for basic filtering UI.

---

### TimelineItem.tsx

- **Purpose:**
  Renders a single artifact as a timeline item, with icon, type, time, and preview content. Provides a clickable card for detail view.

- **Props:**
  ```ts
  interface TimelineItemProps {
    artifact: ArtifactGlobal;
    onClick: () => void;
  }
  ```

- **Component:**
  ```ts
  export const TimelineItem: React.FC<TimelineItemProps>
  ```
  - Uses artifact config to get icon, color, badge label, and preview logic.
  - Formats timestamp for display.
  - Renders a colored dot, icon, type, time, and preview content.
  - Uses MUI Box, Paper, Typography, and (optionally) Chip.
  - Includes a helper function to truncate long text.

- **Notes:**
  - Used in legacy or simple timeline UIs.

---

### TimelineSkeleton.tsx

- **Purpose:**
  Renders a skeleton UI for the timeline while loading, including stat cards, filters, and timeline items.

- **Component:**
  ```ts
  export const TimelineSkeleton: React.FC
  ```
  - Renders skeletons for stats, filters, and timeline items.
  - Uses MUI Box and Skeleton for layout and loading visuals.

- **Notes:**
  - Used in the timeline to indicate loading state.

---

### TimelineStats.tsx

- **Purpose:**
  Displays summary statistics for the timeline (total artifacts, first/last interaction, average cadence).

- **Props:**
  ```ts
  interface TimelineStatsProps {
    stats: TimelineStatsData;
  }
  ```

- **Component:**
  ```ts
  export const TimelineStats: React.FC<TimelineStatsProps>
  ```
  - Renders four stat blocks: total artifacts, first interaction, last interaction, average cadence.
  - Uses MUI Paper, Grid, Typography for layout and styling.

- **Notes:**
  - Used in the timeline for summary stats.

---

### index.ts

- **Purpose:**
  Barrel file exporting all timeline feature components for easy import elsewhere in the app.

- **Exports:**
  - `ArtifactTimeline`
  - `EnhancedTimelineItem`
  - `EnhancedTimelineFilters`
  - `EnhancedTimelineStats`
  - `TimelineSkeleton`
  - `ArtifactModal`

- **Notes:**
  - Keeps timeline feature exports organized and consistent.

---

## src/components/features/voice

### VoiceMemoDetailModal.tsx

- **Purpose:**
  Modal dialog for viewing, playing, reprocessing, and deleting a voice memo artifact. Shows transcription, playback controls, and action buttons.

- **Props:**
  ```ts
  interface VoiceMemoDetailModalProps {
    open: boolean;
    onClose: () => void;
    voiceMemo: VoiceMemoArtifact | null;
    playAudio: (audioFilePath: string) => Promise<string | undefined>;
    onDelete: (artifact_id: string) => Promise<void>;
    onReprocess: (artifact_id: string) => Promise<void>;
    isDeleting?: boolean;
    audioPlaybackError?: string | undefined;
    currentPlayingUrl?: string | null;
    processingStatus?: string;
    processingStartTime?: string | null;
    contactName?: string;
  }
  ```

- **Component:**
  ```ts
  export const VoiceMemoDetailModal: React.FC<VoiceMemoDetailModalProps>
  ```
  - Shows transcription, audio playback, and action buttons (reprocess, delete).
  - Handles audio loading, error display, and playback state.
  - Integrates with Toast context for user feedback.
  - Shows processing status and timer if applicable.

- **Notes:**
  - Used in the voice memo modal and contact profile page.

---

### ProcessingIndicator.tsx

- **Purpose:**
  Shows the status of a processing task (e.g., voice memo analysis) with icon, message, and timer.

- **Props:**
  ```ts
  interface ProcessingIndicatorProps {
    status: 'idle' | 'processing' | 'completed' | 'failed';
    startTime?: string;
    message?: string;
    showTimer?: boolean;
    compact?: boolean;
  }
  ```

- **Component:**
  ```ts
  export const ProcessingIndicator: React.FC<ProcessingIndicatorProps>
  ```
  - Displays an icon and message based on status.
  - Shows a timer if processing and startTime are provided.
  - Uses MUI Box, Typography, CircularProgress, and icons.

- **Notes:**
  - Used in the voice memo modal and status displays.

---

### ProcessingStatusBar.tsx

- **Purpose:**
  Displays an info alert when voice memos are actively being processed for a contact.

- **Props:**
  ```ts
  interface ProcessingStatusBarProps {
    activeProcessingCount: number;
    contactName?: string;
  }
  ```

- **Component:**
  ```ts
  export const ProcessingStatusBar: React.FC<ProcessingStatusBarProps>
  ```
  - Renders an MUI Alert with a spinner and message if any memos are processing.

- **Notes:**
  - Used in the contact profile and voice memo UI for processing feedback.

---

### UpdateSuggestionsModal.tsx

- **Purpose:**
  Modal dialog for reviewing and applying AI-generated update suggestions from a voice memo.

- **Props:**
  ```ts
  interface UpdateSuggestionsModalProps {
    open: boolean;
    onClose: () => void;
    suggestions: ContactUpdateSuggestion[];
    suggestionRecordId: string | null;
    contactName: string;
    transcriptionText: string;
    onApprove: (suggestionRecordId: string, selectedPaths: string[]) => Promise<void>;
    onReject: (suggestionRecordId: string) => Promise<void>;
    isLoading?: boolean;
  }
  ```

- **Component:**
  ```ts
  export const UpdateSuggestionsModal: React.FC<UpdateSuggestionsModalProps>
  ```
  - Lists suggestions with checkboxes, confidence chips, and reasoning.
  - Allows user to select which updates to apply.
  - Handles approve/reject actions and loading state.
  - Uses MUI Dialog, Card, Checkbox, Chip, Alert, and Typography.

- **Notes:**
  - Used in the voice memo modal and suggestions workflow.

---

## src/components/features/voice-memos

### VoiceRecorder.tsx

- **Purpose:**
  Provides a UI and logic for recording, uploading, and processing voice memos as artifacts for a contact. Handles microphone access, recording, upload to Supabase Storage, artifact creation, and polling for transcription.

- **Props:**
  ```ts
  interface VoiceRecorderProps {
    contactId: string;
    onRecordingComplete?: (artifact: any) => void;
    onError?: (error: string) => void;
  }
  ```

- **Component:**
  ```ts
  export const VoiceRecorder: React.FC<VoiceRecorderProps>
  ```
  - Handles microphone access, recording, and duration tracking.
  - Uploads audio to Supabase Storage and creates a voice memo artifact in the database.
  - Polls for transcription completion and updates UI accordingly.
  - Shows loading, error, and success states.
  - Uses MUI Card, CardContent, Typography, Box, IconButton, CircularProgress, Alert, LinearProgress, and icons.
  - Integrates with TanStack Query for cache invalidation after upload.
  - Handles cleanup of media streams and timers on unmount.

- **Notes:**
  - Used in the contact profile page and voice memo flows for artifact creation.

---

## src/components/features/linkedin

### LinkedInProfileModal.tsx

- **Purpose:**
  Modal dialog for displaying a detailed, styled LinkedIn profile artifact, with update (rescrape) and view-on-LinkedIn actions.

- **Props:**
  ```ts
  interface LinkedInProfileModalProps {
    open: boolean;
    onClose: () => void;
    artifact: LinkedInArtifact;
    contactId?: string;
    contactName?: string;
    contactLinkedInUrl?: string;
  }
  ```

- **Component:**
  ```ts
  export const LinkedInProfileModal: React.FC<LinkedInProfileModalProps>
  ```
  - Renders a modal with LinkedIn-style header, avatar, name, headline, location, and profile link.
  - Shows About, Experience, Education, and Skills sections, each styled and icon-labeled.
  - Handles rescrape (update) action with loading and error states.
  - Uses MUI Modal, Fade, Box, Typography, Avatar, Button, Chip, Paper, Alert, and icons.
  - Helper functions for date formatting and initials.
  - Handles missing data gracefully with fallback UI.

- **Notes:**
  - Used in the artifact modal and contact profile for LinkedIn artifact details.

---

### LinkedInImportForm.tsx

- **Purpose:**
  Form for importing a LinkedIn profile by URL, triggering the backend import API.

- **Props:**
  ```ts
  interface LinkedInImportFormProps {
    onProfileFetched: (response: LinkedInImportApiResponse) => void;
  }
  ```

- **Component:**
  ```ts
  export const LinkedInImportForm: React.FC<LinkedInImportFormProps>
  ```
  - Renders a text field for LinkedIn URL and a submit button.
  - Calls `/api/linkedin/import` and passes the response to the parent via `onProfileFetched`.
  - Handles loading and error states.
  - Uses MUI Box, Typography, TextField, Button, CircularProgress, Alert, and LinkedIn icon.

- **Notes:**
  - Used in the new contact flow and LinkedIn import UI.

---

## src/components/features/suggestions

### SuggestionsPanel.tsx

- **Purpose:**
  Panel for reviewing, selecting, and applying or rejecting AI-generated update suggestions for a contact.

- **Props:**
  ```ts
  interface SuggestionsPanelProps {
    contactId: string;
    isOpen: boolean;
    onClose: () => void;
    suggestions: UpdateSuggestionRecord[];
    onApplySuggestions: (suggestionIds: string[], selectedPathsMap: Record<string, string[]>) => Promise<void>;
    onRejectSuggestions: (suggestionIds: string[]) => Promise<void>;
    onMarkAsViewed: (suggestionId: string) => Promise<void>;
    isLoading?: boolean;
  }
  ```

- **Component:**
  ```ts
  export const SuggestionsPanel: React.FC<SuggestionsPanelProps>
  ```
  - Manages selection state for suggestions (auto-selects high confidence).
  - Allows bulk apply/reject, select all, and clear selection.
  - Groups suggestions by record (e.g., voice memo) and shows source info.
  - Uses MUI Paper, Box, Typography, IconButton, Alert, CircularProgress, and custom components.

- **Notes:**
  - Used in the contact profile and suggestions workflow.

---

### SuggestionCard.tsx

- **Purpose:**
  Card for displaying a single update suggestion, with selection, confidence, and reasoning.

- **Props:**
  ```ts
  interface SuggestionCardProps {
    suggestion: ContactUpdateSuggestion;
    onToggleSelect: (selected: boolean) => void;
    selected: boolean;
    showSource?: boolean;
    compact?: boolean;
    sourceTimestamp?: string;
  }
  ```

- **Component:**
  ```ts
  export const SuggestionCard: React.FC<SuggestionCardProps>
  ```
  - Shows field name, action, confidence indicator, suggested value, and reasoning.
  - Allows selection via checkbox.
  - Uses MUI Card, CardContent, Box, Typography, Checkbox, Chip, Divider, and custom ConfidenceIndicator.

- **Notes:**
  - Used in the suggestions panel and update modal.

---

### SuggestionNotificationBadge.tsx

- **Purpose:**
  Notification badge for showing the number and priority of pending suggestions for a contact.

- **Props:**
  ```ts
  interface SuggestionNotificationBadgeProps {
    contactId: string;
    count: number;
    onClick: () => void;
    priority?: 'high' | 'medium' | 'low';
    hasNewSuggestions?: boolean;
  }
  ```

- **Component:**
  ```ts
  export const SuggestionNotificationBadge: React.FC<SuggestionNotificationBadgeProps>
  ```
  - Renders a badge with count and color based on priority.
  - Animates if there are new suggestions.
  - Uses MUI Badge, IconButton, Tooltip, and Notifications icon.

- **Notes:**
  - Used in the contact header and dashboard for suggestion alerts.

---

### BulkActionsToolbar.tsx

- **Purpose:**
  Toolbar for bulk selection and actions (apply, reject, clear) on suggestions.

- **Props:**
  ```ts
  interface BulkActionsToolbarProps {
    selectedCount: number;
    totalCount: number;
    onApplySelected: () => void;
    onRejectSelected: () => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
    disabled?: boolean;
    isLoading?: boolean;
  }
  ```

- **Component:**
  ```ts
  export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps>
  ```
  - Shows select all checkbox, selected count, and action buttons.
  - Disables actions when loading or nothing is selected.
  - Uses MUI Box, Typography, Button, Checkbox, FormControlLabel, Divider, CircularProgress, and icons.

- **Notes:**
  - Used in the suggestions panel for bulk actions.

---

### ConfidenceIndicator.tsx

- **Purpose:**
  Visual indicator of suggestion confidence, with color, label, progress bar, and tooltip.

- **Props:**
  ```ts
  interface ConfidenceIndicatorProps {
    confidence: number;
    reasoning?: string;
    conflicting?: boolean;
    size?: 'small' | 'medium' | 'large';
  }
  ```

- **Component:**
  ```ts
  export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps>
  ```
  - Shows a progress bar, percentage, label, and (if conflicting) a warning icon.
  - Tooltip displays confidence, reasoning, and conflict warning.
  - Uses MUI Box, Tooltip, LinearProgress, Chip, Typography, and Warning icon.

- **Notes:**
  - Used in the suggestions panel and suggestion cards.

---

## src/components/ui

### SourceAttribution.tsx

- **Purpose:**
  Provides source attribution UI for fields, showing the origin artifact and allowing navigation to the source.

- **Components:**
  - `SourceTooltip`: Styled tooltip showing source type, title, excerpt, and navigation action.
  - `SourcedField`: Wrapper for any field, displays a source indicator, tooltip, and navigation if the field is sourced.

- **Props:**
  ```ts
  interface SourcedFieldProps {
    fieldPath: string;
    contactId: string;
    children: React.ReactNode;
    showIndicator?: boolean;
    compact?: boolean;
    className?: string;
  }
  ```

- **Key Logic:**
  - Uses `useSourceAttribution` hook to fetch and navigate to source info.
  - Shows a tooltip with artifact details and a clickable icon for navigation.
  - Uses MUI Tooltip, Box, Chip, IconButton, CircularProgress, Typography, and styled components.

- **Notes:**
  - Used throughout context sections and timeline for field-level source tracking.

---

### ToastContainer.tsx

- **Purpose:**
  Renders a stack of toast notifications using context.

- **Component:**
  ```ts
  export const ToastContainer: React.FC
  ```
  - Consumes `useToast` context for toasts and hideToast.
  - Renders each toast using `ToastItem`.
  - Uses MUI Box for fixed positioning and stacking.

- **Notes:**
  - Used at the app root to display notifications.

---

### ToastItem.tsx

- **Purpose:**
  Renders a single toast notification with icon, message, action, and auto-dismiss progress.

- **Props:**
  ```ts
  interface ToastItemProps {
    toast: Toast;
    onHide: () => void;
  }
  ```

- **Component:**
  ```ts
  export const ToastItem: React.FC<ToastItemProps>
  ```
  - Shows alert with icon, message, optional action button, and close button.
  - Auto-dismisses after duration with a progress bar.
  - Uses MUI Alert, AlertTitle, IconButton, LinearProgress, Box, Button, Typography, and icons.

- **Notes:**
  - Used by ToastContainer for each notification.

---

### CollapsibleSection.tsx

- **Purpose:**
  Card-like section with a collapsible body, used for grouping content.

- **Props:**
  ```ts
  interface CollapsibleSectionProps {
    title: string;
    children: ReactNode;
    initialOpen?: boolean;
    titleVariant?: 'h5' | 'h6' | 'subtitle1';
  }
  ```

- **Component:**
  ```ts
  export const CollapsibleSection: React.FC<CollapsibleSectionProps>
  ```
  - Renders a Paper with a clickable header and collapsible content.
  - Uses MUI Paper, Box, Typography, IconButton, Collapse, and icons.

- **Notes:**
  - Used throughout the app for context, timeline, and grouped UI sections.

---

## src/components/providers

### AppProviders.tsx

- **Purpose:** Root provider component that wraps the app in all necessary context and state providers.
- **Props:**
  ```ts
  interface AppProvidersProps {
    children: React.ReactNode;
  }
  ```
- **Component:**
  ```ts
  export default function AppProviders({ children }: AppProvidersProps)
  ```
  - Sets up a TanStack QueryClient and provides it via QueryClientProvider.
  - Wraps children in ThemeRegistry (MUI theme), AuthProvider (auth context), ToastProvider (toast context), and ReactQueryDevtools.
  - Ensures all app pages have access to theme, auth, query, and toast state.

---

## src/components/auth

### ProtectedRoute.tsx

- **Purpose:** Guards a route or component tree, redirecting unauthenticated users to the login page.
- **Props:**
  ```ts
  interface ProtectedRouteProps {
    children: React.ReactNode;
  }
  ```
- **Component:**
  ```ts
  export const ProtectedRoute: React.FC<ProtectedRouteProps>
  ```
  - Uses `useAuth` to get user and loading state.
  - If loading, shows a loading spinner and message.
  - If not authenticated, redirects to `/auth/login` and shows a spinner while redirecting.
  - If authenticated, renders children.
  - Uses MUI Box, CircularProgress, Typography, and Next.js router.

---

## src/components/layout

### DashboardLayout.tsx

- **Purpose:** Provides the main dashboard layout with responsive navigation drawer, app bar, and user menu.
- **Props:**
  ```ts
  interface DashboardLayoutProps {
    children: React.ReactNode;
  }
  ```
- **Component:**
  ```ts
  export const DashboardLayout: React.FC<DashboardLayoutProps>
  ```
  - Renders a responsive sidebar (drawer) with navigation links (Dashboard, Contacts).
  - App bar with menu toggle, page title, and user avatar/profile menu.
  - User menu includes profile and sign out actions.
  - Handles mobile/desktop drawer switching and user sign out.
  - Uses MUI AppBar, Drawer, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, and icons.
  - Wraps children in the main content area.

---

## src/components/theme

### ThemeRegistry.tsx

- **Purpose:**  
  Provides the MUI theme and font setup for the entire app, wrapping children in a `ThemeProvider` and applying global CSS baseline. Integrates custom Google fonts (Geist Sans and Mono) via Next.js font loader and sets CSS variables for font families.

- **Imports:**
  - React
  - MUI: `ThemeProvider` as `MuiThemeProvider`, `createTheme`, `CssBaseline`
  - Next.js Google fonts: `Geist`, `Geist_Mono`

- **Font Setup:**
  - Loads Geist Sans and Mono, sets CSS variables `--font-geist-sans` and `--font-geist-mono` for use in the theme and global styles.

- **Theme Definition:**
  ```ts
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
    },
    typography: {
      fontFamily: 'var(--font-geist-sans)',
    },
  });
  ```

- **Component:**
  ```ts
  export default function ThemeRegistry({ children }: { children: React.ReactNode })
  ```
  - Wraps children in `<MuiThemeProvider theme={theme}>`
  - Applies `<CssBaseline />` for consistent base styles
  - Ensures all app content uses the custom theme and fonts

- **Notes:**
  - This is the root theme provider for the app, used in `AppProviders`.
  - Follows MUI + Tailwind integration best practices by using MUI for structure and Tailwind for custom styles.

---

## src/types

### index.ts

- **Purpose:**  
  Central export for all type definitions, re-exporting from specific type files and defining global types used across the app.

- **Re-exports:**
  - `./contact`
  - `./artifact`
  - `./timeline`

- **Global Interfaces:**
  - `ExperienceItem`, `EducationItem`, `GoalItem`, `VentureItem`, `FamilyMember`, `User`
  - These are used for professional/personal context, goals, ventures, and user info.

- **Example:**
  ```ts
  export interface ExperienceItem {
    id: string;
    role: string;
    company: string;
    startDate: string;
    endDate?: string | null;
    description?: string | null;
    isCurrent?: boolean;
  }
  ```

---

### rapidapi.ts

- **Purpose:**  
  Type definitions for LinkedIn profile import and RapidAPI integration.

- **Key Interfaces:**
  - `LinkedInImportApiRequestBody`
  - `LinkedInImage`, `LinkedInGeo`, `LinkedInLanguage`, `LinkedInDate`
  - `LinkedInSchoolOrCompany`, `LinkedInEducation`, `LinkedInPosition`, `LinkedInSkill`, `LinkedInCertification`, `LinkedInProject`, `LinkedInVolunteering`
  - `RapidLinkedInProfile` (main LinkedIn profile structure)
  - `LinkedInImportApiResponse` (API response structure)

- **Notes:**
  - Closely matches the structure returned by RapidAPI for LinkedIn scraping.
  - Used for both backend API validation and frontend type safety.

---

### timeline.ts

- **Purpose:**  
  Timeline and artifact grouping types for the artifact timeline feature.

- **Key Interfaces:**
  - `ArtifactTimelineConfig` (icon, color, badge, preview logic)
  - `GroupedArtifact` (artifacts grouped by date)
  - `TimelineStatsData` (summary stats for timeline)

- **Notes:**
  - Extends artifact types for timeline-specific display logic.

---

### contact.ts

- **Purpose:**  
  Comprehensive type definitions for contacts, including professional and personal context, next connection, and field source tracking.

- **Key Interfaces:**
  - `ProfessionalContext`, `ProfessionalAchievementItem`, `Mentions`
  - `PersonalContext`, `FamilyMemberDetail`, `PersonalMilestone`, `ConversationStarters`
  - `Contact` (core contact type, based on Supabase DB row)
  - `ConnectionAgendaItem`, `ConnectionAgenda`, `NextConnection`
  - `FieldSources` (maps field paths to artifact IDs)

- **Notes:**
  - All context fields are designed for extensibility and AI-driven enrichment.
  - Uses Supabase-generated types for DB compatibility.

---

### artifact.ts

- **Purpose:**  
  Discriminated unions and interfaces for all artifact types, including LinkedIn, POG, Ask, Voice Memo, Email, Meeting, and Note artifacts.

- **Key Types and Interfaces:**
  - `ArtifactTypeEnum`, `ExtendedArtifactType`, `ArtifactType`
  - `ArtifactGlobal` (base artifact type)
  - `LinkedInArtifactContent`, `LinkedInArtifact`, `POGArtifactContent`, `POGArtifact`, `AskArtifactContent`, `AskArtifact`, `VoiceMemoArtifact`, `EmailArtifact`, `MeetingArtifact`, `NoteArtifact`
  - `TypedArtifact` (union of all specific artifact types)
  - `DatabaseArtifactInsert`, `DatabaseArtifactRow` (Supabase DB types)

- **Notes:**
  - All artifacts must have: timestamp, content, type, contact_id (per artifact system pattern).
  - Designed for extensibility and type-safe artifact handling.

---

### suggestions.ts

- **Purpose:**  
  Types for AI-generated contact update suggestions and suggestion records.

- **Key Interfaces:**
  - `ContactUpdateSuggestion` (field path, action, value, confidence, reasoning)
  - `UpdateSuggestionRecord` (suggestion record, status, user selections, artifact join)

- **Notes:**
  - Used for both backend suggestion application and frontend review UI.

---

## src/lib/supabase

### types_db.ts

- **Purpose:**
  Supabase-generated TypeScript types for the entire database schema. Provides strict typing for all tables, enums, and utility types used throughout the app.

- **Key Exports:**
  - `Json`: Recursive type for JSONB fields.
  - `Database`: Main type describing all tables, views, functions, enums, and composite types in the `public` schema.
  - `Tables`, `TablesInsert`, `TablesUpdate`: Utility types for table row, insert, and update shapes.
  - `Enums`, `CompositeTypes`: Utility types for enums and composite types.
  - `Constants`: Enum values for artifact types.

- **Tables:**
  - `artifacts`: All artifact records, including voice memos, LinkedIn profiles, POGs, etc.
  - `contact_update_suggestions`: AI-generated update suggestions for contacts.
  - `contacts`: Core contact records, including context fields and field source tracking.
  - `next_connections`: Scheduled or past connection events for contacts.

- **Enums:**
  - `artifact_type_enum`: All supported artifact types (note, email, call, meeting, linkedin_message, linkedin_post, file, other, linkedin_profile, pog, ask, milestone, voice_memo).

- **Notes:**
  - Used as the source of truth for all DB-related types in the app.
  - Ensures type safety for all Supabase operations.

---

### database.types.ts

- **Purpose:**
  Alternative or legacy Supabase-generated types for the database schema. Structure is nearly identical to `types_db.ts` but may include additional schemas (e.g., `graphql_public`).

- **Key Exports:**
  - `Json`, `Database`, `Tables`, `TablesInsert`, `TablesUpdate`, `Enums`, `CompositeTypes`, `Constants`

- **Notes:**
  - Used for type compatibility in some client/server code.
  - Should be kept in sync with `types_db.ts`.

---

### client.ts

- **Purpose:**
  Sets up the Supabase client for use in browser/client-side code. Handles environment variable validation and exports a typed Supabase client instance.

- **Key Logic:**
  - Validates `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Exports a singleton `supabase` client for use in hooks and components.

- **Component:**
  ```ts
  export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  ```

- **Notes:**
  - Only the main export is used; additional client/server helpers are commented for future use.

---

### server.ts

- **Purpose:**
  Sets up the Supabase client for use in server-side code (API routes, server components). Handles cookie management for SSR and secure auth.

- **Key Logic:**
  - Uses `createServerClient` from `@supabase/ssr` and Next.js `cookies` API.
  - Exports an async `createClient` function that returns a typed Supabase client with cookie support.

- **Component:**
  ```ts
  export async function createClient() { ... }
  ```

- **Notes:**
  - Handles both getting and setting cookies for session management.
  - Ignores errors when called from a Server Component (safe for middleware/session refresh).

---

### auth.ts

- **Purpose:**
  Provides all authentication logic for Supabase, including sign up, sign in, sign out, session management, and password reset.

- **Key Exports:**
  - `signUp`, `signIn`, `signOut`, `getCurrentUser`, `getCurrentSession`, `resetPassword`, `updatePassword`, `onAuthStateChange`, `isAuthenticated`
  - Types: `AuthState`, `SignUpData`, `SignInData`, `AuthResponse`

- **Key Logic:**
  - All API calls are wrapped in try-catch for error handling.
  - Uses the exported `supabase` client from `client.ts`.
  - Handles user/session retrieval, password management, and auth state listeners.

- **Notes:**
  - Follows best practices for error handling and user feedback.
  - Used by the app's auth context and protected routes.

---

### types.ts

- **Purpose:**
  Placeholder for custom Supabase types. Currently empty.

- **Notes:**
  - Reserved for future type extensions or overrides.

---

## src/lib/hooks

### useContacts.ts

- **Purpose:**
  Fetches and manages the list of contacts for the authenticated user. Handles loading, error, and refetch logic. Used throughout the dashboard and contact management UI.

- **Signature:**
  ```ts
  export const useContacts: () => {
    contacts: Contact[] | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
  }
  ```

- **Key Logic:**
  - Uses TanStack Query to fetch contacts from Supabase.
  - Handles error and loading states.
  - Provides a `refetch` method for manual refresh.

- **Notes:**
  - Returns contacts sorted by most recently updated.
  - Used in the contacts list, new contact flow, and suggestions panel.

---

### useContactProfile.ts

- **Purpose:**
  Fetches and manages the full profile for a single contact, including all context fields and related artifacts.

- **Signature:**
  ```ts
  export const useContactProfile: (contactId: string) => {
    contact: Contact | null;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
  }
  ```

- **Key Logic:**
  - Uses TanStack Query to fetch a contact by ID from Supabase.
  - Handles error and loading states.
  - Provides a `refetch` method for manual refresh.

- **Notes:**
  - Used in the contact profile page, context sections, and artifact timeline.

---

### useArtifacts.ts

- **Purpose:**
  Fetches and manages all artifacts for a given contact. Handles filtering, sorting, and real-time updates.

- **Signature:**
  ```ts
  export const useArtifacts: (contactId: string) => {
    artifacts: ArtifactGlobal[] | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
  }
  ```

- **Key Logic:**
  - Uses TanStack Query to fetch artifacts from Supabase.
  - Handles error and loading states.
  - Provides a `refetch` method for manual refresh.
  - Supports artifact type filtering and timeline grouping.

- **Notes:**
  - Used in the artifact timeline, suggestions, and context source attribution.

---

### useArtifactTimeline.ts

- **Purpose:**
  Groups and filters artifacts for display in the timeline UI. Computes timeline stats and handles filter state.

- **Signature:**
  ```ts
  export const useArtifactTimeline: (artifacts: ArtifactGlobal[] | undefined) => {
    groupedArtifacts: GroupedArtifact[];
    stats: TimelineStatsData;
    filterTypes: ArtifactType[];
    setFilterTypes: (types: ArtifactType[]) => void;
  }
  ```

- **Key Logic:**
  - Groups artifacts by date for timeline display.
  - Computes stats: total artifacts, first/last interaction, average cadence.
  - Manages filter state for artifact types.

- **Notes:**
  - Used in the contact timeline page and timeline stats UI.

---

### useArtifactModalData.ts

- **Purpose:**
  Manages the state and data for the artifact detail modal, including loading, error, and artifact selection logic.

- **Signature:**
  ```ts
  export const useArtifactModalData: (contactId: string) => {
    selectedArtifact: ArtifactGlobal | null;
    setSelectedArtifact: (artifact: ArtifactGlobal | null) => void;
    isModalOpen: boolean;
    openModal: (artifact: ArtifactGlobal) => void;
    closeModal: () => void;
    isLoading: boolean;
    error: string | null;
  }
  ```

- **Key Logic:**
  - Manages modal open/close state and selected artifact.
  - Handles loading and error state for artifact details.
  - Integrates with artifact list and timeline for modal launching.

- **Notes:**
  - Used in the artifact timeline and contact profile page.

---

### useVoiceMemos.ts

- **Purpose:**
  Fetches and manages all voice memo artifacts for a contact. Handles polling for processing status and playback state.

- **Signature:**
  ```ts
  export const useVoiceMemos: (contactId: string) => {
    voiceMemos: VoiceMemoArtifact[] | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
    playAudio: (audioFilePath: string) => Promise<string | undefined>;
    currentPlayingUrl: string | null;
    audioPlaybackError: string | undefined;
  }
  ```

- **Key Logic:**
  - Uses TanStack Query to fetch voice memos from Supabase.
  - Handles polling for processing/transcription status.
  - Manages audio playback state and error handling.

- **Notes:**
  - Used in the voice memo modal, recorder, and contact profile page.

---

### useUpdateSuggestions.ts

- **Purpose:**
  Fetches and manages AI-generated update suggestions for a contact. Handles approval, rejection, and application of suggestions.

- **Signature:**
  ```ts
  export const useUpdateSuggestions: (contactId: string) => {
    suggestions: UpdateSuggestionRecord[];
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
    approveSuggestion: (suggestionId: string, selectedPaths: string[]) => Promise<void>;
    rejectSuggestion: (suggestionId: string) => Promise<void>;
    markAsViewed: (suggestionId: string) => Promise<void>;
  }
  ```

- **Key Logic:**
  - Uses TanStack Query to fetch suggestions from Supabase.
  - Handles approval, rejection, and marking as viewed via API calls.
  - Provides optimistic updates and error handling.

- **Notes:**
  - Used in the suggestions panel, update modal, and contact profile page.

---

### useSourceAttribution.ts

- **Purpose:**
  Fetches and manages source attribution for contact fields, mapping fields to the artifact that provided their value.

- **Signature:**
  ```ts
  export const useSourceAttribution: (contactId: string) => {
    getSourceForField: (fieldPath: string) => ArtifactGlobal | null;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
  }
  ```

- **Key Logic:**
  - Fetches field source mapping from Supabase.
  - Provides a method to get the source artifact for any field path.
  - Handles loading and error states.

- **Notes:**
  - Used in the source attribution UI and context sections.

---

### useNextConnection.ts

- **Purpose:**
  Fetches and manages the next scheduled connection for a contact, including agenda items and status transitions.

- **Signature:**
  ```ts
  export const useNextConnection: (contactId: string) => {
    nextConnection: NextConnection | null;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
    updateStatus: (status: string) => Promise<void>;
    addAgendaItem: (item: ConnectionAgendaItem) => Promise<void>;
    removeAgendaItem: (itemId: string) => Promise<void>;
  }
  ```

- **Key Logic:**
  - Uses TanStack Query to fetch next connection from Supabase.
  - Handles status updates and agenda item management via API calls.
  - Provides optimistic updates and error handling.

- **Notes:**
  - Used in the next connection panel and contact profile page.

---

### useLinkedInModal.ts

- **Purpose:**
  Manages the state and data for the LinkedIn profile modal, including loading, error, and rescrape logic.

- **Signature:**
  ```ts
  export const useLinkedInModal: (contactId: string) => {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
    linkedInArtifact: LinkedInArtifact | null;
    isLoading: boolean;
    error: string | null;
    rescrapeProfile: () => Promise<void>;
  }
  ```

- **Key Logic:**
  - Manages modal open/close state and selected LinkedIn artifact.
  - Handles loading and error state for LinkedIn data.
  - Provides a method to trigger a rescrape of the LinkedIn profile via API.

- **Notes:**
  - Used in the LinkedIn profile modal and contact profile page.

---

## src/lib/utils

### formatting.ts

- **Purpose:**
  Utility functions for formatting dates, names, and other display values throughout the app.

- **Key Functions:**
  - `formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string`  
    Formats a date string or Date object into a human-readable string using Intl options.
  - `formatName(name: string): string`  
    Capitalizes and formats a name string for display.
  - Additional helpers for formatting phone numbers, emails, and other fields as needed.

- **Notes:**
  - Used in UI components, timeline, and context displays for consistent formatting.

---

### time.ts

- **Purpose:**
  Utility functions for time calculations, durations, and relative time formatting.

- **Key Functions:**
  - `getRelativeTime(date: string | Date): string`  
    Returns a string like "2 days ago" or "in 3 hours" for a given date.
  - `formatDuration(seconds: number): string`  
    Formats a duration in seconds as "mm:ss" or "hh:mm:ss".
  - Additional helpers for time math, intervals, and countdowns as needed.

- **Notes:**
  - Used in voice memo UI, timeline, and stats displays for user-friendly time output.

---

## src/lib/contexts

### AuthContext.tsx

- **Purpose:**
  Provides authentication state and methods to the React component tree using React Context. Handles user session, loading state, and exposes sign-in/sign-out logic.

- **Key Exports:**
  - `AuthProvider`: Context provider component wrapping the app.
  - `useAuth`: Custom hook to access auth state and actions.

- **Context Value:**
  ```ts
  interface AuthContextValue {
    user: User | null;
    loading: boolean;
    signIn: (provider: string) => Promise<void>;
    signOut: () => Promise<void>;
    // ...other auth methods
  }
  ```

- **Key Logic:**
  - Manages Supabase session and user state.
  - Handles OAuth sign-in, sign-out, and session refresh.
  - Provides loading and error state for auth actions.

- **Notes:**
  - Used by ProtectedRoute, login page, and all components needing user info.

---

### ToastContext.tsx

- **Purpose:**
  Provides toast notification state and methods to the React component tree using React Context. Handles showing, hiding, and stacking toasts.

- **Key Exports:**
  - `ToastProvider`: Context provider component wrapping the app.
  - `useToast`: Custom hook to access toast state and actions.

- **Context Value:**
  ```ts
  interface ToastContextValue {
    toasts: Toast[];
    showToast: (toast: Toast) => void;
    hideToast: (id: string) => void;
  }
  ```

- **Key Logic:**
  - Manages a stack/queue of toast notifications.
  - Handles auto-dismiss, manual close, and action callbacks.
  - Provides context to ToastContainer and ToastItem components.

- **Notes:**
  - Used by ToastContainer, ToastItem, and any component needing to show notifications.

---

## src/lib/services

### linkedinService.ts

- **Purpose:**
  Provides all logic for interacting with the LinkedIn import and rescrape APIs, including calling backend endpoints, handling RapidAPI integration, and transforming LinkedIn profile data.

- **Key Functions:**
  - `importLinkedInProfile(linkedinUrl: string): Promise<LinkedInImportApiResponse>`  
    Calls the `/api/linkedin/import` endpoint to fetch and return LinkedIn profile data for a given URL.
  - `rescrapeLinkedInProfile(contactId: string, linkedinUrl: string): Promise<LinkedInImportApiResponse>`  
    Calls the `/api/linkedin/rescrape` endpoint to refresh LinkedIn data for a contact.
  - `transformRapidLinkedInProfile(raw: RapidLinkedInProfile): LinkedInArtifactContent`  
    Converts the raw RapidAPI LinkedIn profile into the app's artifact content format.

- **Key Logic:**
  - Handles API request/response, error handling, and data validation.
  - Transforms and normalizes LinkedIn data for use in artifacts and contact context.
  - Provides helper functions for date parsing, experience/education extraction, and field mapping.

- **Notes:**
  - Used by LinkedIn import forms, modals, and contact onboarding flows.
  - Centralizes all LinkedIn-related API logic for maintainability.

---

## src/config

### artifactConfig.ts

- **Purpose:**
  Central configuration for artifact types, icons, colors, labels, and preview logic. Used to drive the artifact timeline, UI badges, and artifact modals.

- **Key Exports:**
  - `ARTIFACT_CONFIG`: Record of all artifact types and their display config (icon, color, badge, preview function).
  - `getArtifactConfig(type: ArtifactType | string | undefined): ArtifactTimelineConfig`: Returns the config for a given artifact type, with fallback logic.
  - `ALL_ARTIFACT_TYPES`: Array of all supported artifact types (excluding 'default').

- **Key Logic:**
  - Maps each artifact type to a React icon, color, badge label, and preview function.
  - Provides a helper to truncate text for previews.
  - Handles unknown or custom artifact types with a default config.

- **Notes:**
  - Used throughout the timeline, artifact modals, and context source attribution for consistent artifact display.

---

### sourceConfig.ts

- **Purpose:**
  Configuration for mapping artifact/source types to icons, colors, labels, and navigation patterns. Drives the source attribution UI and navigation logic.

- **Key Exports:**
  - `SOURCE_CONFIG`: Record of source types and their config (icon, color, label, route pattern, target page behavior).
  - `SourceTypeConfig`: Interface describing the config shape for each source type.

- **Key Logic:**
  - Maps each source type (e.g., voice_memo, linkedin_profile, email, meeting, note) to a Material-UI icon, color, label, and route pattern.
  - Specifies how the UI should behave when a source is clicked (open modal, scroll to section, view detail, etc).
  - Provides a default config for unknown source types.

- **Notes:**
  - Used by the SourceAttribution UI and navigation logic for field sources.

---

## supabase/functions

### parse-voice-memo/index.ts

- **Purpose:**  
  AI-powered voice memo analysis using OpenAI GPT. Processes completed voice memo transcriptions to generate contact update suggestions based on the conversation content and existing contact context.

- **Key Functionality:**
  - Fetches voice memo artifact by ID from database
  - Validates artifact is ready for processing (voice_memo type, completed transcription, pending AI parsing)
  - Updates processing status to prevent duplicate processing
  - Calls OpenAI GPT with transcription and contact context to generate structured suggestions
  - Stores suggestions in `contact_update_suggestions` table
  - Updates artifact status to completed/failed based on results

- **API Contract:**
  ```ts
  // Request body
  { artifactId: string }
  
  // Response
  { 
    success: boolean; 
    message: string; 
    suggestions_count: number 
  }
  ```

- **Error Handling:**
  - Updates artifact status to 'failed' on any processing error
  - Comprehensive logging for debugging AI parsing issues
  - Graceful handling of OpenAI API failures

- **Integration Points:**
  - Called by `transcribe-voice-memo` function after transcription completion
  - Can be manually triggered via `/api/voice-memo/[id]/reprocess` route
  - Uses OpenAI GPT-4 for intelligent contact update generation

---

### transcribe-voice-memo/index.ts

- **Purpose:**  
  Handles voice-to-text transcription using OpenAI Whisper API. Processes uploaded voice memo audio files and converts them to text, then triggers AI parsing.

- **Key Functionality:**
  - Triggered by database trigger when voice memo artifact is created
  - Downloads audio file from Supabase Storage using signed URLs
  - Sends audio to OpenAI Whisper API for transcription
  - Updates artifact with transcription text and duration
  - Automatically triggers `parse-voice-memo` function for AI analysis

- **API Contract:**
  ```ts
  // Request body (from database trigger)
  { record: VoiceMemoRecord }
  
  // VoiceMemoRecord interface
  interface VoiceMemoRecord {
    id: string;
    type: string;
    audio_file_path: string;
    transcription_status: string;
  }
  ```

- **Processing Pipeline:**
  1. Validate voice memo record and status
  2. Update status to 'processing'
  3. Create signed URL for audio file access
  4. Download audio file from storage
  5. Send to OpenAI Whisper with verbose_json format
  6. Extract transcription text and duration
  7. Update artifact with results
  8. Trigger AI parsing function

- **Error Handling:**
  - Updates transcription_status to 'failed' on errors
  - Stores error details in metadata field
  - Comprehensive error logging for debugging

---

### read_contact_context/index.ts

- **Purpose:**  
  Simple Edge Function to retrieve contact context (personal and professional) with proper RLS (Row Level Security) enforcement.

- **Key Functionality:**
  - Fetches personal_context and professional_context fields for a given contact
  - Enforces user authentication and RLS policies
  - Used for external integrations or specific context retrieval needs

- **API Contract:**
  ```ts
  // Request body
  { contactId: string }
  
  // Response
  {
    personal_context: PersonalContext;
    professional_context: ProfessionalContext;
  }
  ```

- **Security:**
  - Uses user's auth token for RLS enforcement
  - Only returns data for contacts owned by authenticated user
  - Proper error handling for unauthorized access

---

## supabase/migrations

### Migration History & Database Evolution

- **Purpose:**  
  Complete database schema evolution from initial setup to current state. Each migration represents a specific feature addition or schema change.

- **Migration Files:**
  1. **`20250525034240_initial_schema.sql`**: Initial database setup with contacts and artifacts tables
  2. **`20250525192438_add_contact_context_and_next_connections.sql`**: Added personal/professional context fields and next_connections table
  3. **`20250525201058_add_linkedin_profile_to_artifact_enum.sql`**: Added LinkedIn profile artifact type
  4. **`20250525201319_make_linkedin_url_not_null.sql`**: Schema constraint updates
  5. **`20250525204509_add_voice_memo_artifacts_schema.sql`**: Voice memo artifact support with transcription fields
  6. **`20250525210030_add_voice_memo_transcription_trigger.sql`**: Database trigger for automatic transcription processing
  7. **`20250525221811_add_ai_parsing_system.sql`**: AI parsing status tracking and suggestion system
  8. **`20250525222622_update_trigger_for_vault_and_config.sql`**: Trigger updates for storage integration
  9. **`20250526111120_add_suggestion_tracking_columns.sql`**: Enhanced suggestion tracking and user interaction
  10. **`20250526115442_add_artifact_processing_timestamps.sql`**: Processing timestamp tracking for performance monitoring
  11. **`20250526130715_add_field_sources_and_artifact_types.sql`**: Field source attribution system

- **Key Schema Components:**
  - **Row Level Security (RLS)**: All tables protected by user ownership policies
  - **Artifact System**: Unified storage for all relationship data with type discrimination
  - **Source Attribution**: Tracking which artifact provided each contact field value
  - **AI Processing Pipeline**: Status tracking for voice memo transcription and parsing
  - **Suggestion System**: AI-generated contact updates with confidence scoring

---

## database/schema.sql

- **Purpose:**  
  Current snapshot of the complete database schema, representing the final state after all migrations.

- **Key Tables:**
  - **`contacts`**: Core contact records with context fields and source tracking
  - **`artifacts`**: All relationship data stored as timestamped artifacts
  - **`contact_update_suggestions`**: AI-generated suggestions for contact updates
  - **`next_connections`**: Scheduled connection events and agenda items

- **Notes:**
  - Used for reference and new environment setup
  - Should be kept in sync with migration files
  - Includes all RLS policies and triggers

---

## Configuration Files

### package.json

- **Purpose:**  
  Project dependencies, scripts, and metadata for the Next.js application.

- **Key Dependencies:**
  - **Next.js 15.3.2**: App Router with React 19
  - **Material-UI v7**: Component library and theming
  - **Supabase**: Database, auth, storage, and real-time
  - **TanStack Query v5**: Server state management and caching
  - **TypeScript 5**: Type safety and development experience
  - **Tailwind CSS v4**: Utility-first styling

- **Scripts:**
  - `dev`: Development server with Turbopack
  - `build`: Production build
  - `start`: Production server
  - `lint`: ESLint code quality checks

---

### next.config.ts

- **Purpose:**  
  Next.js configuration with Supabase SSR integration.

- **Key Configuration:**
  ```ts
  const nextConfig: NextConfig = {
    serverExternalPackages: ['@supabase/ssr'],
  };
  ```

- **Notes:**
  - Ensures proper Supabase SSR package handling
  - Minimal configuration following Next.js 15 best practices

---

### tsconfig.json

- **Purpose:**  
  TypeScript configuration with strict mode and path aliases.

- **Key Settings:**
  - **Strict Mode**: Enabled for type safety
  - **Path Aliases**: `@/*` maps to `./src/*` for clean imports
  - **Target**: ES2017 for modern browser support
  - **Module Resolution**: Bundler mode for Next.js compatibility

---

### supabase/config.toml

- **Purpose:**  
  Supabase Edge Functions configuration.

- **Configuration:**
  ```toml
  [functions.parse-voice-memo]
  enabled = true
  verify_jwt = true
  import_map = "./functions/parse-voice-memo/deno.json"
  entrypoint = "./functions/parse-voice-memo/index.ts"
  ```

- **Notes:**
  - JWT verification enabled for security
  - Custom entrypoint configuration for each function

---

## Static Assets

### public/

- **Purpose:**  
  Static assets served directly by Next.js.

- **Files:**
  - **`next.svg`**: Next.js logo
  - **`vercel.svg`**: Vercel deployment logo  
  - **`globe.svg`**: Global/web icon
  - **`window.svg`**: Window/app icon
  - **`file.svg`**: File/document icon

- **Notes:**
  - SVG format for scalability
  - Used in UI components and branding

---

## GitHub Configuration

### .github/pull_request_template.md

- **Purpose:**  
  Standardized pull request template for consistent code review process.

- **Template Sections:**
  - Change description and motivation
  - Testing checklist
  - Code quality verification
  - Documentation updates
  - Breaking changes notification

- **Notes:**
  - Ensures comprehensive PR descriptions
  - Promotes consistent review standards
  - Helps maintain code quality and documentation 

---

# Architecture Overview

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Supabase DB    │    │  External APIs  │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ React Pages │ │◄──►│ │   Contacts   │ │    │ │ OpenAI GPT  │ │
│ │ Components  │ │    │ │   Artifacts  │ │    │ │ Whisper API │ │
│ │ Hooks       │ │    │ │ Suggestions  │ │    │ │             │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │TanStack     │ │    │ │ Edge         │ │◄──►│ │ RapidAPI    │ │
│ │Query Cache  │ │    │ │ Functions    │ │    │ │ LinkedIn    │ │
│ └─────────────┘ │    │ │ Storage      │ │    │ │             │ │
│                 │    │ │ Real-time    │ │    │ └─────────────┘ │
└─────────────────┘    │ │ Auth         │ │    │                 │
                       │ └──────────────┘ │    └─────────────────┘
                       └──────────────────┘
```

## Data Flow Architecture

### 1. **Voice Memo Processing Pipeline**
```
Voice Recording → Upload to Storage → Transcription (Whisper) → AI Analysis (GPT) → Suggestions → User Review → Contact Updates
```

### 2. **LinkedIn Import Pipeline**
```
LinkedIn URL → RapidAPI Scrape → Data Transform → Artifact Creation → Contact Population → Source Attribution
```

### 3. **Real-time Update Flow**
```
User Action → Database Change → Supabase Channel → React Component → UI Update
```

---

# Business Logic Patterns

## Core Patterns

### 1. **Artifact System Pattern**
- **Principle**: All relationship data is stored as timestamped artifacts
- **Benefits**: Complete audit trail, source attribution, temporal queries
- **Implementation**: Discriminated unions for type safety, unified storage table
- **Usage**: Notes, emails, meetings, voice memos, LinkedIn profiles, POGs, asks

### 2. **Source Attribution Pattern**
- **Principle**: Every contact field tracks which artifact provided its value
- **Benefits**: Data provenance, trust indicators, update conflict resolution
- **Implementation**: `field_sources` JSONB column mapping field paths to artifact IDs
- **Usage**: Professional context, personal context, contact details

### 3. **Suggestion Workflow Pattern**
- **Principle**: AI generates suggestions, users review and approve changes
- **Benefits**: User control, data quality, learning opportunities
- **Implementation**: Separate suggestions table with confidence scoring and user selections
- **Usage**: Voice memo analysis, LinkedIn profile updates, context enrichment

### 4. **Real-time Synchronization Pattern**
- **Principle**: UI stays synchronized with database changes across sessions
- **Benefits**: Multi-device consistency, collaborative features, live updates
- **Implementation**: Supabase channels with TanStack Query cache invalidation
- **Usage**: Contact updates, artifact creation, suggestion notifications

## Advanced Patterns

### 5. **Progressive Enhancement Pattern**
- **Principle**: Core functionality works without JavaScript, enhanced with React
- **Benefits**: Performance, accessibility, SEO, resilience
- **Implementation**: Server-side rendering with client-side hydration
- **Usage**: Contact profiles, timeline views, authentication flows

### 6. **Optimistic Update Pattern**
- **Principle**: UI updates immediately, rolls back on server errors
- **Benefits**: Perceived performance, responsive interactions
- **Implementation**: TanStack Query mutations with rollback logic
- **Usage**: Contact edits, artifact creation, suggestion approval

### 7. **Type-Safe API Pattern**
- **Principle**: End-to-end type safety from database to UI
- **Benefits**: Runtime error prevention, developer experience, refactoring safety
- **Implementation**: Supabase generated types, discriminated unions, strict TypeScript
- **Usage**: All database operations, API routes, component props

---

# Integration Points

## External API Integrations

### 1. **OpenAI Integration**
- **Whisper API**: Voice-to-text transcription with duration extraction
- **GPT-4 API**: Intelligent contact update suggestion generation
- **Usage Patterns**: Batch processing, error handling, rate limiting
- **Security**: API keys in environment variables, server-side only

### 2. **RapidAPI LinkedIn Integration**
- **Profile Scraping**: Public LinkedIn profile data extraction
- **Data Transformation**: Raw API response to structured contact data
- **Usage Patterns**: On-demand scraping, data validation, rate limiting
- **Security**: API keys in environment variables, user-initiated only

### 3. **Supabase Integration**
- **Database**: PostgreSQL with RLS, real-time subscriptions
- **Authentication**: OAuth providers (Google), session management
- **Storage**: Voice memo audio files, profile images
- **Edge Functions**: Server-side processing, AI operations
- **Real-time**: Live updates, collaborative features

## Internal API Architecture

### 1. **Next.js API Routes**
- **RESTful Design**: Standard HTTP methods and status codes
- **Authentication**: Supabase session validation
- **Error Handling**: Consistent error response format
- **Type Safety**: Request/response type definitions

### 2. **Supabase Edge Functions**
- **Deno Runtime**: Modern JavaScript/TypeScript execution
- **Database Access**: Direct Supabase client with service role
- **Async Processing**: Long-running AI operations
- **Error Recovery**: Status tracking and retry mechanisms

---

# State Management Architecture

## Client State Management

### 1. **TanStack Query (Server State)**
- **Caching Strategy**: Stale-while-revalidate with background updates
- **Invalidation**: Targeted cache invalidation on mutations
- **Optimistic Updates**: Immediate UI feedback with rollback
- **Error Handling**: Retry logic and error boundaries

### 2. **React Context (Global State)**
- **Authentication**: User session, loading states, auth actions
- **Notifications**: Toast messages, error alerts, success feedback
- **Theme**: MUI theme provider, dark/light mode (future)

### 3. **Component State (Local State)**
- **Form State**: Input values, validation, submission status
- **UI State**: Modal open/close, filter selections, pagination
- **Interaction State**: Hover effects, focus management, loading indicators

## State Synchronization Patterns

### 1. **Real-time Subscriptions**
- **Contact Updates**: Live sync across browser tabs/devices
- **Artifact Creation**: Immediate timeline updates
- **Suggestion Notifications**: Real-time suggestion badges

### 2. **Cache Invalidation Strategy**
- **Mutation Success**: Invalidate related queries
- **Real-time Events**: Selective cache updates
- **Background Refresh**: Periodic data freshness checks

---

# Security & Performance Considerations

## Security Architecture

### 1. **Row Level Security (RLS)**
- **Implementation**: All tables protected by user ownership policies
- **Benefits**: Data isolation, multi-tenancy, authorization at database level
- **Patterns**: User-based filtering, contact ownership validation

### 2. **Authentication & Authorization**
- **OAuth Integration**: Google sign-in via Supabase Auth
- **Session Management**: Secure cookie-based sessions
- **API Protection**: All routes require valid authentication
- **Edge Function Security**: JWT verification for sensitive operations

### 3. **Data Privacy**
- **Encryption**: Database encryption at rest and in transit
- **API Keys**: Environment variable storage, server-side only
- **User Data**: GDPR compliance considerations, data export/deletion

## Performance Optimization

### 1. **Database Performance**
- **Indexing Strategy**: Optimized queries for contact and artifact lookups
- **Query Optimization**: Selective field fetching, join optimization
- **Connection Pooling**: Supabase managed connection pooling

### 2. **Frontend Performance**
- **Code Splitting**: Route-based and component-based splitting
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Optimization**: Tree shaking, dead code elimination
- **Caching Strategy**: Browser caching, CDN integration

### 3. **Real-time Performance**
- **Selective Subscriptions**: Only subscribe to relevant data changes
- **Debounced Updates**: Prevent excessive re-renders
- **Background Processing**: AI operations don't block UI

---

# Development Workflow

## Database Management

### 1. **Migration Strategy**
- **Version Control**: All schema changes tracked in migration files
- **Naming Convention**: Timestamp-based migration naming
- **Rollback Support**: Down migrations for schema rollbacks
- **Environment Sync**: Consistent schema across dev/staging/prod

### 2. **Type Generation Workflow**
```bash
# Generate types from Supabase schema
npx supabase gen types typescript --project-id [PROJECT_ID] > src/lib/supabase/types_db.ts

# Apply migrations to cloud
echo "Y" | npx supabase db push
```

### 3. **Development Database**
- **Local Development**: Supabase local development setup
- **Seeding**: Test data generation for development
- **Reset Procedures**: Clean slate development environment

## Code Quality & Testing

### 1. **Type Safety**
- **Strict TypeScript**: Comprehensive type checking
- **Generated Types**: Database schema to TypeScript types
- **Runtime Validation**: API request/response validation

### 2. **Code Standards**
- **ESLint Configuration**: Next.js recommended rules
- **Prettier Integration**: Consistent code formatting
- **Import Organization**: Grouped imports with absolute paths

### 3. **Testing Strategy** (Future Implementation)
- **Unit Tests**: Utility functions, hooks, components
- **Integration Tests**: API routes, database operations
- **E2E Tests**: Critical user workflows
- **Performance Tests**: Load testing for AI operations

## Deployment Pipeline

### 1. **Environment Management**
- **Development**: Local Supabase + Next.js dev server
- **Staging**: Supabase staging + Vercel preview deployments
- **Production**: Supabase production + Vercel production

### 2. **CI/CD Pipeline** (Future Implementation)
- **Automated Testing**: Run tests on pull requests
- **Type Checking**: Ensure type safety before deployment
- **Migration Validation**: Verify schema changes
- **Performance Monitoring**: Track deployment impact

### 3. **Monitoring & Observability**
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: API response times, query performance
- **User Analytics**: Feature usage, conversion tracking
- **AI Operation Monitoring**: Transcription/parsing success rates

---

# Future Planning Considerations

## Scalability Roadmap

### 1. **Data Volume Scaling**
- **Artifact Archiving**: Long-term storage strategy for old artifacts
- **Query Optimization**: Advanced indexing and query patterns
- **Caching Layer**: Redis integration for frequently accessed data

### 2. **User Base Scaling**
- **Multi-tenancy**: Enhanced RLS policies for enterprise customers
- **Team Features**: Shared contacts, collaboration tools
- **API Rate Limiting**: Protect against abuse and ensure fair usage

### 3. **Feature Expansion**
- **Mobile Application**: React Native or native mobile apps
- **Browser Extension**: LinkedIn integration, email parsing
- **API Platform**: Third-party integrations, webhook system

## Technical Debt & Improvements

### 1. **Code Organization**
- **Feature Modules**: Better separation of concerns
- **Shared Components**: Reusable UI component library
- **Testing Coverage**: Comprehensive test suite implementation

### 2. **Performance Optimization**
- **Database Optimization**: Query performance monitoring and optimization
- **Frontend Optimization**: Bundle size reduction, loading performance
- **AI Processing**: Batch processing, queue management

### 3. **Developer Experience**
- **Documentation**: Comprehensive API and component documentation
- **Development Tools**: Better debugging, profiling tools
- **Automation**: Automated testing, deployment, monitoring