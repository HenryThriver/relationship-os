# Changelog

All notable changes to Relationship OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-05-27

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

## [Unreleased] - 2024-05-25

### Added
- Initial database schema setup via Supabase migrations:
  - `contacts` table with columns: id, user_id, name, email, company, title, linkedin_url, location, notes, created_at, updated_at.
  - `artifacts` table with columns: id, contact_id, user_id, type (enum), content, metadata, timestamp, created_at.
  - `artifact_type_enum` for artifact types.
  - Helper function `handle_updated_at` for automatic `updated_at` timestamp updates.
  - RLS policies for data isolation on `contacts` and `artifacts` tables, scoped to `auth.uid()`.
- Generated TypeScript types (`types_db.ts`) for the new database schema.
- Initial project setup with Next.js 15, TypeScript, and Tailwind CSS
- Project documentation structure (CHANGELOG, ROADMAP, README)
- Supabase integration with client configuration
- Database schema for contacts and artifacts tables
- TypeScript types for database entities
- Authentication helpers and hooks
- Row Level Security (RLS) policies for data isolation
- Database setup documentation and SQL schema files
- LinkedIn profile import feature:
  - API route (`/api/linkedin/import`) to fetch profile data from RapidAPI.
  - Frontend form (`LinkedInImportForm`) for URL input and data preview.
  - Integration into "Add New Contact" page (`/dashboard/contacts/new`) to create contacts from LinkedIn profiles.
  - Creates a `linkedin_profile` artifact with the raw API response.
  - Updated `artifact_type_enum` to include `linkedin_profile`.
  - Made `linkedin_url` on `contacts` table `NOT NULL`.
  - Added `useArtifacts` hook for artifact creation.
  - Placeholder page for individual contact details (`/dashboard/contacts/[id]`).

### Changed
- Refined `RapidLinkedInProfile` TypeScript types based on actual API sample response.
- Updated LinkedIn import flow on "Add New Contact" page (`/dashboard/contacts/new`):
  - Improved data mapping from LinkedIn profile to contact fields.
  - Ensured the originally submitted LinkedIn URL is used for the contact record.
  - Added a confirmation step to review fetched data before saving.
  - Ensured the full raw API response is stored in the `linkedin_profile` artifact's metadata.
  - Improved UI/UX of the import form and review section (icon, placeholder, button text & layout).
- Corrected linter errors related to hook usage and prop types in the LinkedIn import feature.
- **Routing Correction**: Consolidated contacts functionality under `/dashboard/contacts/*`. Main contacts list is now at `/dashboard/contacts`, and new contact page is at `/dashboard/contacts/new`.
- Addressed hydration errors by adding `suppressHydrationWarning` to root layout and guiding user to disable problematic browser extensions.

### Fixed
- Resolved Supabase client connection issues by ensuring correct environment variable loading.
- Resolved 500 error on LinkedIn import API route by ensuring RapidAPI environment variables are correctly loaded.
- Addressed Next.js client component errors related to MUI theme functions.
- Fixed various module resolution and path aliasing issues.

### Removed
- Temporary `src/app/(dashboard)/contacts/page.tsx` (minimal placeholder, functionality moved).
  (Note: The directory `src/app/(dashboard)/contacts/[id]` and `src/app/(dashboard)/contacts/new` and their contents should also be removed if they were not already deleted as part of the move to `/dashboard/contacts/*`)
- Removed temporary debugging `console.log` from Supabase client.

## [0.2.0] - 2025-05-25

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