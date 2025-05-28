# Changelog

All notable changes to Relationship OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2025-05-28

### Added
- **Enhanced Timeline UI with Alternating Cards:**
  - Implemented beautiful alternating timeline design with central timeline line and enhanced visual hierarchy.
  - Created `EnhancedTimelineItem` component with position-aware rendering (left/right alternating cards).
  - Added timeline dots, connector lines, and smooth hover animations for better user experience.
  - Developed `TimelineSkeleton` component for improved loading states with alternating card placeholders.
  - Enhanced artifact configuration with rich emoji-based status indicators and consistent styling.
  - Maintained existing modal functionality while upgrading visual presentation.

- **Loop Architecture & Modal System:**
  - Enhanced `EnhancedLoopModal` with comprehensive loop management features.
  - Integrated loop-specific handlers for status updates, editing, deletion, sharing, and completion.
  - Added graceful error handling for undefined loop properties to prevent runtime crashes.
  - Implemented consistent "simple cards + modal details" pattern across all artifact types.

- **Database Schema & Type Safety:**
  - Connected to cloud Supabase database and regenerated TypeScript types for latest schema.
  - Resolved type mismatches in `LoopSuggestions`, `useLoops` hook, and LinkedIn service.
  - Fixed property access issues in contact profile display and professional snapshot cards.
  - Added proper type casting for JSON fields to ensure database compatibility.

### Fixed
- **Runtime Error Resolution:**
  - Fixed `TypeError: Cannot read properties of undefined (reading 'label')` in `LoopStatusBadge`.
  - Resolved `TypeError: Cannot read properties of undefined (reading 'replace')` in `EnhancedLoopModal`.
  - Added null checks and fallbacks for all potentially undefined properties.

- **Type System Improvements:**
  - Updated `LoopSuggestionFromDB` interface to match actual database schema.
  - Fixed `LoopTemplateAction` property access (`default_notes_template` vs `description_template`).
  - Resolved contact profile photo access to use LinkedIn data properly.
  - Fixed `AddContactForm` to pass proper `ContactInsert` object structure.

- **Code Quality & Development Experience:**
  - Added `supabase/functions/**/*` to TypeScript exclusions to eliminate irrelevant Deno errors.
  - Cleaned up linting errors and improved type safety across the application.
  - Enhanced error handling and graceful degradation throughout the timeline system.

### Changed
- **Timeline Interaction Pattern:**
  - Simplified timeline to use consistent card-based design for all artifact types.
  - Moved complex loop-specific UI to dedicated modals for better UX consistency.
  - Updated `ArtifactTimeline` to use unified `EnhancedTimelineItem` component.
  - Improved modal state management and query invalidation patterns.

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

## [0.3.0] - 2024-05-25

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
  - Significantly expanded `