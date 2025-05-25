# Changelog

All notable changes to Relationship OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Next.js 15, TypeScript, and Tailwind CSS
- Project documentation structure (CHANGELOG, ROADMAP, README)
- Supabase integration with client configuration
- Database schema for contacts and artifacts tables
- TypeScript types for database entities
- Authentication helpers and hooks
- Row Level Security (RLS) policies for data isolation
- Database setup documentation and SQL schema files

### Changed

### Fixed

### Removed

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
- Configured MUI `ThemeProvider` with a custom theme and `CssBaseline`.
- Ensured Next.js 14 App Router compatibility for MUI theme handling by creating `ThemeRegistry.tsx`.
- Set up automatic redirection based on authentication status (e.g., from `/` to `/dashboard` or `/auth/login`).

### Changed
- Updated root layout (`/app/layout.tsx`) to include `AuthProvider` and `ThemeRegistry`.
- Modified `src/lib/supabase/client.ts` for robust environment variable handling.

### Fixed
- Resolved Supabase client connection issues by ensuring correct environment variable loading.
- Addressed Next.js client component errors related to MUI theme functions.
- Fixed various module resolution and path aliasing issues.

### Removed
- Removed temporary debugging `console.log` from Supabase client.

## [0.1.0] - 2025-05-24

### Added
- Initial Next.js project scaffolding
- TypeScript configuration
- Tailwind CSS setup
- ESLint configuration
- Basic project structure

### Notes
- Project initialized with create-next-app
- Ready for Relationship OS development to begin 