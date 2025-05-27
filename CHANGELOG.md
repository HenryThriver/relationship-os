# Changelog

All notable changes to Relationship OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2024-05-26

### Added
- **LinkedIn Profile Modal & Re-scrape:**
  - Implemented `LinkedInProfileModal.tsx` to display LinkedIn profile artifacts with a design inspired by LinkedIn's native interface.
  - Created `src/app/api/linkedin/rescrape/route.ts` API endpoint for re-scraping LinkedIn profiles, creating new artifacts.
  - Developed `useLinkedInModal.ts` hook to manage re-scraping state and API calls.
  - Enhanced `ArtifactModal.tsx` to conditionally render `LinkedInProfileModal` for `linkedin_profile` artifacts.
  - Integrated modal into `ArtifactTimeline.tsx`.
- **UI Enhancements & Styling:**
  - Iteratively refined `LinkedInProfileModal` styles for header, profile picture, content sections (About, Experience, Education, Skills), buttons, and links, using MUI and Tailwind CSS.
  - Added MUI icons and helper functions like `getInitials`.
- **Data Handling & Mapping:**
  - Updated API data mapping in `src/app/api/linkedin/rescrape/route.ts` to align RapidAPI fields with internal artifact metadata structure (e.g., `summary` to `about`).
  - Added `formatDate` and `formatDuration` helpers.

### Fixed
- **Linting & Code Quality:**
  - Resolved numerous linter errors across various files, including:
    - `src/components/features/linkedin/LinkedInProfileModal.tsx`
    - `src/lib/hooks/useLinkedInModal.ts`
    - `src/types/artifact.ts` (with `eslint-disable` for `metadata: any`)
    - `src/types/rapidapi.ts`
    - `src/app/api/linkedin/rescrape/route.ts`
    - `src/app/api/linkedin/import/route.ts`
    - `src/app/api/artifacts/[id]/route.ts`
    - `src/app/api/suggestions/apply/route.ts`
    - `src/app/api/voice-memo/[id]/delete/route.ts`
    - `src/app/api/voice-memo/[id]/reprocess/route.ts`
    - `src/app/dashboard/contacts/page.tsx` (removed unused MUI imports)
    - `src/app/dashboard/contacts/[id]/page.tsx` (removed unused imports, typed `any` instances, fixed type mismatches for modal props, removed commented code).
  - Standardized error handling in API routes (typed catch errors as `unknown` with `instanceof Error` checks).
- **Data Display:** Addressed issues where some LinkedIn profile metadata fields (summary, experience, education) were not displaying in the modal by ensuring correct data fetching and propagation through RLS/select queries.
- **Re-scrape Logic:** Improved re-scrape trigger logic, including fetching `linkedin_url` from the `contacts` table as a fallback.
- **Visual Bugs:** Fixed header cutoff in `LinkedInProfileModal` by applying `flexShrink: 0`.

## [0.3.0] - 2024-05-18

### Added
- **Voice Memo Intelligence:**
  - Implemented AI-powered analysis of voice memos to extract contact information.
  - System for suggesting updates to contact profiles based on voice memo content.
  - UI for reviewing, applying, or rejecting these AI-generated suggestions.
  - Real-time status indicators (`ProcessingIndicator`, `ProcessingStatusBar`) for voice memo transcription and AI analysis.
  - `VoiceMemoDetailModal` for viewing memo details, transcription, and initiating reprocessing.
- **Granular Source Attribution System:**
  - Added `field_sources` to contacts, mapping specific fields to their originating artifacts (e.g., a voice memo, email).
  - Updated AI suggestion application process to populate these granular source links.
  - `SourcedField` UI component to visually indicate sourced data and provide hover tooltips with source details (type, title, excerpt, timestamp).
  - Clickable links in tooltips to navigate directly to the source artifact.
  - Centralized configuration (`sourceConfig.ts`) for source types, icons, and navigation.
  - Integrated source attribution throughout `PersonalContextDisplay` and `ProfessionalContextDisplay`.
- **Enhanced Contact Profile & Data Management:**
  - Significantly expanded `personal_context` and `professional_context` schemas with more detailed fields.
  - Robust TanStack Query hooks for managing contacts (`useContactProfile`), voice memos (`useVoiceMemos`), update suggestions (`useUpdateSuggestions`), and artifacts (`useArtifacts`).
  - Improved UI for displaying comprehensive personal and professional context.
- **Core Technology & Authentication:**
  - Migrated to `@supabase/ssr` for enhanced Next.js compatibility and server-side rendering capabilities with Supabase.
  - Refactored authentication flow, removing deprecated auth helpers.

### Changed
- Refined `SourcedField` UI to use a less obtrusive icon-only display for better visual clarity.
- Improved TanStack Query cache invalidation strategies for voice memo processing and suggestion application, ensuring UI consistency.

### Fixed
- Resolved type errors related to `education` field handling (allowing both string and array).
- Fixed HTML nesting errors in voice memo status display within lists.
- Addressed various issues in the AI suggestion application logic and data sourcing for array items.
- Stabilized authentication and session management with the new `@supabase/ssr` setup.

## [0.2.0] - 2024-05-11

### Added
- Implemented Google OAuth authentication system with Supabase.
- Created login page (`/auth/login`) with Google Sign-In button.
- Implemented OAuth callback handler (`/auth/callback`).
- Developed `AuthContext` for managing authentication state globally.
- Created `ProtectedRoute` HOC to secure dashboard routes.
- Built responsive `DashboardLayout` with sidebar navigation and user profile menu.
- Added basic dashboard home page (`/dashboard`) with placeholder stats.
- Added placeholder contacts page (`/dashboard/contacts`).
- Integrated Material-UI (MUI) v5 for UI components and styling.
- Configured MUI `ThemeProvider` with a custom theme and `