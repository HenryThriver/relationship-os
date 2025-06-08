# Relationship OS

A **Relationship Intelligence System** that transforms networking from overwhelming to systematic. Relationship OS helps high-achievers build meaningful relationship capital through structured artifact capture, loop management, and intelligent automation.

## What is Relationship OS?

Relationship OS is not a CRM or contact manager—it's a comprehensive relationship operating system designed around four core pillars:

1. **Strategic Connection Architecture**: Identify and connect with the right people aligned to your goals
2. **Proactive Relationship Nurturing**: Transform passive networking into active relationship tending
3. **Strategic Ask Management**: Be clear about what to ask, of whom, and when
4. **Sustainable Systems Design**: Build relationship practices that scale without burnout

### Key Features

- **Universal Artifact System**: Capture and organize all relationship intelligence in timestamped artifacts
- **Loop Management**: Track POGs (Packets of Generosity) and Asks through complete lifecycles
- **Smart Queuing**: Pre-connection agenda building and conversation preparation
- **Reciprocity Dashboard**: Visual relationship balance with intelligent giving recommendations
- **Context Continuity**: Never lose track of personal shares, commitments, or conversation threads

## Tech Stack

- **Framework**: Next.js 15 with App Router and TypeScript
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Authentication**: Supabase Auth
- **UI Components**: Material-UI (MUI) v5
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand for client state
- **Server State**: TanStack Query for caching and synchronization
- **Development**: ESLint, TypeScript strict mode

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account (for database and auth)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd relationship-os
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Run the Supabase migrations (coming in Phase 1)
   - Set up Row Level Security policies

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development Workflow

### Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (dashboard)/        # Dashboard layout group
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                 # Reusable UI components
│   └── features/           # Feature-specific components
├── lib/
│   ├── supabase/          # Supabase client and types
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom hooks
│   └── stores/            # Zustand stores
└── types/                 # TypeScript type definitions
```

### Code Style

- **TypeScript**: Strict mode with proper type definitions
- **Components**: Functional components with TypeScript interfaces
- **Imports**: Absolute imports with `@/` alias for `src/`
- **Styling**: MUI components + Tailwind for custom styling
- **State**: Zustand for client state, TanStack Query for server state

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Development Phases

See [ROADMAP.md](./ROADMAP.md) for detailed development phases:

- **Phase 1**: Core Foundation (contacts + artifacts)
- **Phase 2**: Loop Management (POGs, Asks, status tracking)  
- **Phase 3**: Intelligence Features (AI insights, automation)

## Contributing

1. Follow the established code style and patterns
2. Write TypeScript interfaces for all data structures
3. Use proper error handling and loading states
4. Test components and business logic
5. Update documentation for new features

## Architecture Principles

- **Artifact-First Design**: All relationship intelligence stored as timestamped artifacts
- **Loop-Based Workflows**: POGs and Asks managed through complete status lifecycles
- **Relationship Capital Focus**: Building mutual value, not one-way customer management
- **Sustainable Scale**: Systems that work for 50+ meaningful relationships
- **Privacy by Design**: User data isolation with Row Level Security

## Centralized Artifact Processing Architecture

Relationship OS features a unified, extensible artifact processing system that automatically handles AI processing and suggestion generation for all artifact types:

### Configuration-Driven Processing
- **Centralized Configuration**: All artifact processing rules defined in `artifact_processing_config` database table
- **Zero-Code Extensibility**: New artifact types require only database configuration, no code changes
- **Dynamic Validation**: Processing requirements (content, transcription, metadata) defined per artifact type

### Unified AI Processing Pipeline
- **Single Trigger Function**: `trigger_unified_artifact_ai_processing()` handles all artifact types
- **Database-Driven Logic**: Edge function dynamically supports new types based on configuration
- **Automatic Processing**: Artifacts with `ai_parsing_status: 'pending'` automatically trigger AI analysis

### Standardized User Experience
- **Consistent UI Components**: Shared `ArtifactSuggestions` component across all modals
- **Universal Processing Status**: Color-coded status indicators (pending → processing → completed)
- **Generic Reprocessing**: Single reprocess endpoint supports all artifact types
- **Unified Suggestions Display**: Consistent suggestion layout with confidence scores and apply/reject actions

### Supported Artifact Types
- **Voice Memos**: Transcription + AI insights extraction
- **Meetings**: Content analysis for action items and key topics  
- **Emails**: Bidirectional analysis with relationship context
- **LinkedIn Posts**: Professional update analysis and relationship intelligence
- **LinkedIn Profiles**: Professional background and skill analysis
- **Future Types**: Automatic support through configuration table

This architecture ensures that adding new relationship intelligence sources (texts, calendar events, social media, etc.) requires minimal development effort while maintaining consistent user experience across all artifact types.

## License

Private project - All rights reserved

### Notes
- Project initialized with create-next-app
- Ready for Relationship OS development to begin

---

*Relationship OS: Transform networking from overwhelming to systematic*
