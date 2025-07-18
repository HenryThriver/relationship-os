# CLAUDE.md

My name is Handsome Hank

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Operations
**CRITICAL: Never use npx with Supabase - CLI is installed globally**

```bash
# Connect to database (established working pattern)
CONNECTION_STRING="postgresql://postgres.zepawphplcisievcdugz:fzm_BEJ7agw5ehz6tcj@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# Common queries
psql "$CONNECTION_STRING" -c "\dt"  # List tables
psql "$CONNECTION_STRING" -c "\d contacts"  # Describe table
psql "$CONNECTION_STRING" -c "SELECT id, name FROM contacts WHERE name ILIKE '%search%';"

# Migration workflow
TIMESTAMP=$(python3 -c 'import datetime; print(datetime.datetime.now().strftime("%Y%m%d%H%M%S"))')
touch "supabase/migrations/${TIMESTAMP}_migration_name.sql"
echo "Y" | supabase db push
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

## Architecture Overview

**Relationship OS** is a comprehensive relationship intelligence system built around four core pillars: Strategic Connection Architecture, Proactive Relationship Nurturing, Strategic Ask Management, and Sustainable Systems Design.

### Core Architecture Patterns

#### Centralized Artifact Processing System
- **Configuration-Driven**: All AI processing rules in `artifact_processing_config` database table
- **Zero-Code Extensibility**: New artifact types require only database configuration
- **Unified Edge Function**: `parse-artifact` handles all artifact types with dynamic routing
- **Automatic Triggering**: Database triggers automatically call AI processing when `ai_parsing_status = 'pending'`

#### Universal Artifact Foundation
All relationship intelligence flows through timestamped artifacts:
- Voice memos, meetings, emails, LinkedIn posts/profiles
- Loop management (POGs and Asks) as special artifact types
- Consistent processing pipeline with AI suggestions
- Status tracking: pending → processing → completed

#### Edge Function Architecture
**CRITICAL**: Use unified processing pattern
- `parse-artifact` is the single edge function for ALL artifact AI processing
- Database triggers automatically call edge functions - don't invoke directly
- To reprocess: Set `ai_parsing_status = 'pending'` in database
- Internal routing based on artifact type and metadata

### Tech Stack

- **Framework**: Next.js 15 with App Router, TypeScript strict mode
- **Database**: Supabase (PostgreSQL with real-time subscriptions, RLS)
- **UI**: Material-UI v5 components + Tailwind CSS v4 for styling
- **State Management**: Zustand (client state) + TanStack Query (server state)
- **External Integrations**: Gmail, Google Calendar, LinkedIn via APIs
- **AI Processing**: Anthropic Claude via edge functions

### Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── (dashboard)/         # Protected dashboard routes
│   ├── auth/               # Authentication pages
│   ├── api/                # API routes for integrations
│   └── onboarding/         # User onboarding flow
├── components/
│   ├── features/           # Domain-specific components
│   │   ├── contacts/       # Contact management
│   │   ├── loops/          # POG/Ask loop management
│   │   ├── timeline/       # Artifact timeline display
│   │   ├── suggestions/    # AI suggestion system
│   │   └── voice-memos/    # Voice recording
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── hooks/              # Custom React hooks
│   ├── services/           # External API integrations
│   ├── supabase/           # Database client & types
│   └── utils/              # Utility functions
└── types/                  # TypeScript definitions
```

### Key Domain Concepts

#### Artifacts
All relationship data stored as timestamped artifacts with unified AI processing:
- **Types**: voice_memo, meeting, email, linkedin_post, linkedin_profile, loop
- **Processing**: Automatic AI analysis with suggestions generation
- **Status Tracking**: pending → processing → completed with timestamps

#### Loops (POGs & Asks)
Special artifacts representing relationship exchanges:
- **POGs**: Packets of Generosity (giving value)
- **Asks**: Requests for help or resources
- **Status Lifecycle**: QUEUED → ACTIVE → PENDING → CLOSED
- **Ownership Tracking**: Whose turn it is to act

#### Contact Intelligence
Comprehensive relationship context:
- **Professional**: Role, company, expertise, career events
- **Personal**: Interests, family, milestones, conversation starters
- **Artifact Timeline**: All interactions chronologically organized
- **Reciprocity Dashboard**: Visual balance of giving/receiving

### Database Safety Rules

- **NEVER** run destructive operations without explicit user approval
- **ALWAYS** use WHERE clauses for UPDATE/DELETE operations
- **ALWAYS** test queries on single records first (add LIMIT 1)
- **NEVER** use `supabase db reset` or data-wiping commands
- **ALWAYS** follow Row Level Security patterns

### Code Conventions

#### TypeScript
- Use strict mode with proper type definitions
- Prefer `interface` over `type` for object shapes
- Always define return types for functions
- Use Supabase generated types

#### Component Structure
```typescript
interface ComponentProps {
  // Props interface
}

export const ComponentName = ({ prop1, prop2 }: ComponentProps) => {
  // Hooks at top
  // Event handlers
  // Render logic
  
  return (
    // JSX
  );
};
```

#### MUI + Tailwind Integration
- Use MUI components for structure (Box, Container, Typography)
- Use Tailwind for spacing, sizing, and custom styles
- Prefer MUI's sx prop over className when using MUI components

#### State Management
- Zustand for client-side state that persists across components
- TanStack Query for server state and caching
- Keep component state local when possible

### Import Patterns
- Group imports: React, third-party, internal components, utilities
- Use absolute imports with @ alias: `@/components`, `@/lib`, `@/types`
- Prefer named exports over default exports (except pages)

### Testing Approach
- Check existing patterns in the codebase before assuming test frameworks
- Search for test files or scripts in package.json to understand testing setup
- Write unit tests for utilities and hooks
- Test user interactions, not implementation details