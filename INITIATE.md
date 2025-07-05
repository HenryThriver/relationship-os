# Initiation Checklist for New Coding Sessions / Features

This document outlines the steps to take at the beginning of every new coding session or when starting to build out a new feature for Connection OS.

## 🚨 CRITICAL: SUPABASE CLI USAGE
**NEVER use `npx` with Supabase commands - the CLI is installed globally. Always use `supabase` directly.**

## 1. Connect to Supabase Project

Ensure you are connected to the correct Supabase project.

- **Project ID**: `zepawphplcisievcdugz`
- **Login (if needed)**:
  ```bash
  supabase login
  ```
- **Link Project (if not already linked or to confirm)**:
  ```bash
  supabase link --project-ref zepawphplcisievcdugz
  ```
  *Note: Subsequent `supabase db push` commands will automatically apply to this linked cloud project.*

## 2. Database Access Patterns - MANDATORY REFERENCE

### 🔥 CRITICAL: Always Use Secure Dynamic Patterns for Database Operations

**🔒 SECURITY FIRST**: Never hardcode production credentials. Always retrieve them dynamically.

### Secure Connection String Retrieval
**ALWAYS use this to get current connection string dynamically**:
```bash
supabase db dump --linked --dry-run
```
This shows the exact connection string in the output. Extract the postgresql:// URL from the pg_dump command.

### Secure psql Access Patterns

**Option 1: Connection String Method (RECOMMENDED)**
```bash
# Get connection string dynamically
CONNECTION_STRING=$(supabase db dump --linked --dry-run 2>/dev/null | grep "postgresql://" | head -1)

# Use it securely
psql "$CONNECTION_STRING" -c "YOUR_SQL_QUERY_HERE"
```

**Option 2: Manual environment variables (when you need individual components)**
```bash
# First get credentials from: supabase db dump --linked --dry-run
# Then manually set environment variables from the output:
# PGHOST="[HOST_FROM_SUPABASE_OUTPUT]" PGPORT="[PORT]" PGUSER="[USER]" PGPASSWORD="[PASSWORD]" PGDATABASE="[DATABASE]" psql -c "YOUR_SQL_HERE"
```

### Common Database Operations Templates

**1. Table Structure Inspection**
```bash
# Get connection first
CONNECTION_STRING=$(supabase db dump --linked --dry-run 2>/dev/null | grep "postgresql://" | head -1)

# List all tables
psql "$CONNECTION_STRING" -c "\dt"

# Describe specific table
psql "$CONNECTION_STRING" -c "\d contacts"
```

**2. Data Analysis Queries**
```bash
# Get connection first
CONNECTION_STRING=$(supabase db dump --linked --dry-run 2>/dev/null | grep "postgresql://" | head -1)

# Count records by type
psql "$CONNECTION_STRING" -c "SELECT type, COUNT(*) FROM artifacts GROUP BY type;"

# Find contact by name
psql "$CONNECTION_STRING" -c "SELECT id, name, email FROM contacts WHERE name ILIKE '%SEARCH_TERM%';"

# Check JSON field structure
psql "$CONNECTION_STRING" -c "SELECT id, professional_context FROM contacts WHERE id = 'CONTACT_ID';"
```

**3. Safe Data Updates**
```bash
# Get connection first
CONNECTION_STRING=$(supabase db dump --linked --dry-run 2>/dev/null | grep "postgresql://" | head -1)

# Update specific contact field
psql "$CONNECTION_STRING" -c "UPDATE contacts SET company = 'New Company' WHERE id = 'CONTACT_ID';"

# Update JSON field
psql "$CONNECTION_STRING" -c "UPDATE contacts SET professional_context = '{\"projects_involved\": [\"Project Name\"]}' WHERE id = 'CONTACT_ID';"
```

**4. Migration and Schema Operations**
```bash
# Apply migration to cloud (auto-confirms)
echo "Y" | supabase db push

# Get timestamp for new migration files
python3 -c 'import datetime; print(datetime.datetime.now().strftime("%Y%m%d%H%M%S"))'

# Generate current types after schema changes
supabase gen types typescript --project-id zepawphplcisievcdugz > src/types/supabase.ts
```

**5. Debug-Specific Queries**
```bash
# Get connection first
CONNECTION_STRING=$(supabase db dump --linked --dry-run 2>/dev/null | grep "postgresql://" | head -1)

# Find malformed data (example: check for encoding issues)
psql "$CONNECTION_STRING" -c "SELECT id, metadata->>'subject' FROM artifacts WHERE type = 'email' AND metadata->>'body_text' LIKE '%â€%' LIMIT 5;"

# Check suggestion data structure
psql "$CONNECTION_STRING" -c "SELECT id, suggested_updates FROM contact_update_suggestions WHERE status = 'pending' LIMIT 3;"

# Verify field paths in suggestions
psql "$CONNECTION_STRING" -c "SELECT DISTINCT jsonb_path_query_array(suggested_updates, '$.suggestions[*].field_path') FROM contact_update_suggestions;"
```

### 🚨 SAFETY RULES - NEVER BREAK THESE

1. **NEVER run destructive operations without explicit user approval**:
   - NO `DROP TABLE`
   - NO `DELETE FROM table_name` without WHERE clause
   - NO `UPDATE table_name SET` without WHERE clause
   - NO `TRUNCATE`

2. **ALWAYS use WHERE clauses for UPDATE/DELETE operations**

3. **ALWAYS backup critical data before major changes**

4. **ALWAYS test queries on single records first** (add LIMIT 1)

5. **ALWAYS provide the exact SQL command for user review before execution**

### Interactive Database Session
For complex debugging, use interactive mode:
```bash
PGHOST="aws-0-us-west-1.pooler.supabase.com" PGPORT="5432" PGUSER="postgres.zepawphplcisievcdugz" PGPASSWORD="fzm_BEJ7agw5ehz6tcj" PGDATABASE="postgres" psql
```

Then use standard psql commands:
- `\dt` - List tables
- `\d table_name` - Describe table structure  
- `\di table_name` - Show indexes
- `\l` - List databases
- `\c database_name` - Connect to database
- `\q` - Quit
- `\h SQL_COMMAND` - Help with SQL
- `\?` - Help with psql commands

## 3. Environment Health Check

Verify the development environment is working properly before starting new work.

- **Install/Update Dependencies**:
  ```bash
  npm ci
  ```
- **Verify App Starts Without Errors**:
  ```bash
  npm run dev
  ```
  *Check that the application starts successfully and note the port (usually 3000 or 3001).*
- **Check TypeScript Compilation**:
  ```bash
  npm run type-check
  ```
  *Ensure there are no TypeScript errors before proceeding.*

## 4. Get Current Timestamp for Migrations

If you anticipate making database schema changes, get the current timestamp for naming new migration files.

- **Command**:
  ```bash
  python3 -c 'import datetime; print(datetime.datetime.now().strftime("%Y%m%d%H%M%S"))'
  ```
  *Use the output of this command as the prefix for your new migration file name (e.g., `YYYYMMDDHHMMSS_my_migration_description.sql`).*

## 5. Review Core Project Documentation

Familiarize yourself with the current state and direction of the project.

- **`APPINDEX.md`**: Review to understand the current application structure, components, pages, and their relationships.
- **`ROADMAP.md`**: Review to align with the broader feature development plan and upcoming milestones.
- **`TODO.md`**: Check for any outstanding smaller tasks, bugs, or immediate priorities.
- **`BIGIDEA.md`**: Revisit to keep the overall project vision and core goals in mind.
- **`CHANGELOG.md`**: Review to be aware of the latest changes and updates merged into the project.

## 6. Review and Validate Database Schema

Understand the current database schema and ensure local environment matches cloud.

- **List Current Migrations**:
  ```bash
  ls supabase/migrations
  ```
  *This helps in understanding the existing table structures, relationships, and any recent changes to the database schema.*

- **Generate Current Types** (if schema changes are expected):
  ```bash
  supabase gen types typescript --project-id zepawphplcisievcdugz > src/types/supabase.ts
  ```
  *This ensures your TypeScript types match the current cloud database schema.*

## 7. Artifact System Review

Review the current artifact system structure, especially when working on new artifact types.

- **Review Existing Artifact Types**: Check `src/types/` for current artifact interfaces and discriminated unions.
- **Check Artifact Database Schema**: Review recent migrations related to artifacts table structure.
- **Understand Artifact Patterns**: Recall the core artifact system patterns (timestamp, content, type, contact_id).

## 8. Integration-Specific Preparation

When working with external services or integrations, verify configurations and credentials.

- **Check Environment Variables**: Ensure all required API keys and configuration values are present in `.env.local`.
- **Verify API Credentials**: Test that external service credentials are valid and have proper scopes.
- **Review Rate Limits**: Be aware of any API rate limits or quotas for external services.
- **Check Integration Documentation**: Review any service-specific documentation or setup guides.

## 9. Recall Key Development Guidelines

Briefly mentally review the "Connection OS Development Rules" (often provided in the chat context or a project-specific rules file). Pay special attention to sections relevant to the task at hand, such as:
    - Tech Stack (Next.js, Supabase, MUI, Tailwind, Zustand, TanStack Query)
    - Project Structure
    - Code Style Preferences (TypeScript, React Patterns, Imports, Component Structure)
    - MUI + Tailwind Integration
    - Database Patterns (Supabase generated types, custom hooks, RLS)
    - Artifact System Patterns
    - Loop Management Patterns
    - Git Conventions

## 10. Setup Git Branch and Sync Local Environment

Ensure your local development environment is synchronized and you are working on an appropriate branch. **Our primary development branch is `develop`. Always work on a feature, bugfix, or task-specific branch. Never commit directly to `main` or `develop`.**

- **Check current branch and status**:
  ```bash
  git status
  ```
- **Update `develop` branch and sync with `main`**:
  This ensures `develop` has the latest from `main` before you start new work.
  ```bash
  git checkout develop
  git pull origin develop
  git merge main # Ensure develop has latest from main (resolve conflicts if any)
  git push origin develop # Push the updated develop branch
  ```
- **Create and switch to a new task-specific branch (from `develop`)**:
  If you are starting new work, create a branch from your up-to-date `develop` branch.
  ```bash
  # Ensure you are on develop first (previous step should cover this)
  # git checkout develop 
  git checkout -b <type>/<short-descriptive-name>
  ```
  *Replace `<type>` with `feature`, `bugfix`, `chore`, `refactor`, etc., and `<short-descriptive-name>` with a concise, hyphenated name reflecting the task.*

- **If continuing work on an existing feature branch**:
  Switch to your branch and ensure it's up-to-date by rebasing onto `develop`.
  ```bash
  git checkout <your-existing-branch-name>
  # First, ensure your local develop is up-to-date (pull if necessary)
  git fetch origin 
  git rebase origin/develop # Or simply 'git rebase develop' if local develop tracks origin/develop and is current
  # If you need to push after rebasing (and it's a shared branch or you want to update your remote)
  # git push origin <your-existing-branch-name> --force-with-lease 
  ```
  *(Note: Use `git push --force-with-lease` cautiously, especially on shared branches. It's generally safer to coordinate with collaborators or use it for your own remote feature branches. If `develop` was updated locally without fetching, you might need `git rebase develop` after ensuring local `develop` is current.)*

## 11. Define and Document Session Goal

Clearly articulate and document the primary objective for the current coding session.

- **Primary Objective**: What specific feature are you building?
- **Success Criteria**: What is the expected outcome or deliverable for this session?
- **Scope**: What bug are you fixing? What refactoring or improvement are you implementing?
- **Dependencies**: Are there any blockers or prerequisites that need to be addressed?
- **Session Context**: Document any relevant context, decisions, or constraints for future reference.

## 12. Session Documentation Template

Consider documenting your session with this template for future reference:

```
Session: [Date] - [Feature/Task Name]
Goal: [Primary objective]
Branch: [Branch name]
Dependencies: [Any external dependencies or blockers]
Key Decisions: [Important architectural or implementation decisions]
Outcome: [What was accomplished]
Next Steps: [What should be done in the next session]
```

---

By following these initiation steps, you can ensure consistency, stay aligned with project standards, and set a clear focus for each development session. 

# Connection OS Development Initiation Guide

## Section 1: Initial Setup Checklist

When starting a new development session or branch:

### 1.1 Supabase Connection
- [ ] Link to project: `supabase link --project-ref zepawphplcisievcdugz`
- [ ] Verify connection: `supabase status`

### 1.2 Dependencies & Environment
- [ ] Install dependencies: `npm ci`
- [ ] Check TypeScript compilation: `npx tsc --noEmit`
- [ ] Verify environment variables are set

### 1.3 Git Workflow Setup
- [ ] Switch to develop branch: `git checkout develop`
- [ ] Pull latest changes: `git pull origin develop`
- [ ] Merge main if needed: `git merge main`
- [ ] Push updated develop: `git push origin develop`
- [ ] Create feature branch: `git checkout -b feature/your-feature-name`

## Section 2: Secure Database Access & Edge Function Patterns

### 2.1 🔒 Secure Database Access (CRITICAL)
**NEVER hardcode credentials. Always use dynamic extraction.**

```bash
# Step 1: Get connection string (ALWAYS run this first)
CONNECTION_STRING=$(supabase db dump --linked --dry-run 2>/dev/null | grep "postgresql://" | head -1)

# Step 2: Use for queries
psql "$CONNECTION_STRING" -c "YOUR_SQL_QUERY_HERE"

# Common patterns:
psql "$CONNECTION_STRING" -c "\dt"  # List tables
psql "$CONNECTION_STRING" -c "\d contacts"  # Describe table
psql "$CONNECTION_STRING" -c "SELECT id, name FROM contacts WHERE name ILIKE '%search%';"
```

### 2.2 🚀 Edge Function Architecture Patterns

#### **UNIFIED PROCESSING PATTERN (ESTABLISHED)**
The codebase uses a **unified edge function architecture** where:

1. **Single Entry Point**: `parse-artifact` is the unified edge function for ALL artifact AI processing
2. **Database Triggers**: All triggers call `parse-artifact`, NOT specialized functions
3. **Internal Routing**: The unified function routes to appropriate processing logic based on artifact type and metadata

#### **Current Edge Function Structure**
```
supabase/functions/
├── parse-artifact/          # 🎯 UNIFIED AI PROCESSING (main entry point)
│   └── index.ts             # Handles ALL artifact types via internal routing
├── transcribe-voice-memo/   # Audio transcription only
├── gmail-sync/              # Gmail integration
└── nightly-calendar-sync/   # Calendar automation
```

#### **Database Trigger Pattern**
All AI processing triggers follow this established pattern:

```sql
-- Unified trigger function (current implementation)
CREATE OR REPLACE FUNCTION public.trigger_unified_artifact_ai_processing()
RETURNS TRIGGER AS $$
DECLARE
  service_key TEXT;
  edge_function_base_url TEXT;
BEGIN
  -- Validation logic...
  
  -- Always call the unified function
  PERFORM net.http_post(
    url := 'https://zepawphplcisievcdugz.supabase.co/functions/v1/parse-artifact',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('artifactId', NEW.id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### **Edge Function Testing & Invocation**
**🚨 CRITICAL: Edge functions are triggered AUTOMATICALLY by database triggers**
**You do NOT need to call edge functions directly - they trigger when artifact status changes**

```bash
# ✅ CORRECT - Trigger AI processing by changing database status
CONNECTION_STRING=$(supabase db dump --linked --dry-run 2>/dev/null | grep "postgresql://" | head -1)

# To reprocess an artifact, simply reset its status to 'pending'
psql "$CONNECTION_STRING" -c "
UPDATE artifacts 
SET ai_parsing_status = 'pending', 
    ai_processing_started_at = NULL, 
    ai_processing_completed_at = NULL 
WHERE id = 'your-artifact-uuid-here';"

# The database trigger will automatically call parse-artifact edge function
# No manual edge function calls needed!

# ❌ WRONG - Don't call edge functions directly unless debugging
# curl -X POST 'https://zepawphplcisievcdugz.supabase.co/functions/v1/parse-artifact' ...

# ✅ Management commands
supabase functions deploy parse-artifact  # Deploy function updates
supabase functions logs parse-artifact    # Monitor function logs
supabase functions serve                  # Serve locally for testing

# ✅ Check processing status
psql "$CONNECTION_STRING" -c "
SELECT id, ai_parsing_status, ai_processing_started_at, ai_processing_completed_at 
FROM artifacts 
WHERE ai_parsing_status IN ('pending', 'processing') 
ORDER BY created_at DESC LIMIT 10;"

# ✅ For debugging only - manual edge function call with proper auth
# Get the correct service key from vault (only for debugging)
VAULT_KEY=$(psql "$CONNECTION_STRING" -t -c "SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'INTERNAL_SERVICE_ROLE_KEY';" | xargs)

# Manual call (debugging only):
curl -X POST 'https://zepawphplcisievcdugz.supabase.co/functions/v1/parse-artifact' \
  --header "Authorization: Bearer $VAULT_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"artifactId": "your-uuid-here"}'
```

#### **Edge Function Implementation Pattern**
```typescript
// Inside parse-artifact/index.ts
serve(async (req: Request) => {
  // 1. Fetch artifact and validate
  const { artifactId } = await req.json();
  const artifact = await fetchArtifact(artifactId);
  
  // 2. Route based on artifact type and metadata
  if (artifact.type === 'voice_memo') {
    // Check if it's an onboarding memo
    const isOnboarding = checkIfOnboardingMemo(artifact, contact);
    
    if (isOnboarding) {
      // Use specialized onboarding prompt
      result = await parseOnboardingVoiceMemo(artifact, contact);
    } else {
      // Use standard relationship intelligence prompt
      result = await parseStandardVoiceMemo(artifact, contact);
    }
  } else if (artifact.type === 'email') {
    result = await parseEmail(artifact, contact);
  }
  // ... other types
  
  // 3. Store results using unified pattern
  await storeResults(result, artifact);
});
```

#### **🚨 Critical Edge Function Rules**

1. **NEVER create separate edge functions for different artifact types**
   - All AI processing goes through `parse-artifact`
   - Use internal routing for specialized logic

2. **NEVER modify database triggers to call different functions**
   - All triggers call `parse-artifact`
   - Specialization happens inside the unified function

3. **Service Key Management**
   - Always retrieve from Vault: `vault.decrypted_secrets` table
   - Key name: `INTERNAL_SERVICE_ROLE_KEY`
   - Never hardcode in functions or migrations

4. **URL Pattern**
   - Always use: `https://zepawphplcisievcdugz.supabase.co/functions/v1/parse-artifact`
   - Never use dynamic URL construction in production

#### **Adding New Artifact Processing**
When adding new artifact types or specialized processing:

1. **Add to processing config table**:
   ```sql
   INSERT INTO artifact_processing_config (artifact_type, enabled, requires_content, requires_transcription)
   VALUES ('new_type', true, true, false);
   ```

2. **Add routing logic to parse-artifact**:
   ```typescript
   // Inside parse-artifact/index.ts
   if (artifact.type === 'new_type') {
     result = await parseNewType(artifact, contact);
   }
   ```

3. **NEVER create new edge functions or modify triggers**

#### **Self-Contact / Onboarding Pattern**
For user profile processing (onboarding voice memos):

```typescript
// Detection pattern
const isOnboardingMemo = contact.is_self_contact && 
                        (artifact.metadata?.is_onboarding === 'true' || 
                         artifact.metadata?.source === 'onboarding_voice_recorder');

// Routing pattern
if (isOnboardingMemo) {
  // Use user profile extraction prompt
  result = await parseOnboardingVoiceMemo(transcription, contact, metadata);
} else {
  // Use relationship intelligence prompt  
  result = await parseStandardVoiceMemo(transcription, contact);
}
```

### 2.3 🔧 Migration Patterns

#### **Schema Changes**
```bash
# Generate migration timestamp
TIMESTAMP=$(python3 -c 'import datetime; print(datetime.datetime.now().strftime("%Y%m%d%H%M%S"))')

# Create migration
touch "supabase/migrations/${TIMESTAMP}_your_migration_name.sql"

# Apply to cloud (auto-confirm)
echo "Y" | supabase db push
```

#### **Type Generation**
```bash
# After schema changes
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

### 2.4 🚨 Database Safety Rules

#### **NEVER RUN THESE COMMANDS**
```bash
# ❌ NEVER - Wipes all data
supabase db reset

# ❌ NEVER - Destructive schema changes without migrations
psql "$CONNECTION_STRING" -c "DROP TABLE contacts;"
```

#### **✅ Safe Operations**
```bash
# ✅ Targeted deletions (with user approval)
psql "$CONNECTION_STRING" -c "DELETE FROM artifacts WHERE type = 'test' AND contact_id = 'specific-id';"

# ✅ Schema inspection
psql "$CONNECTION_STRING" -c "\d+ contacts"
```

## Section 3: Development Workflow

### 3.1 Feature Development
- Create feature branch from develop
- Follow established patterns (see Section 2)
- Test locally before pushing
- Use proper commit messages: `feat: add user profile foundations`

### 3.2 Database Changes
- Always use migrations for schema changes
- Test on cloud database directly (our development environment)
- Generate types after schema changes
- Document breaking changes

### 3.3 Edge Function Changes
- Follow unified architecture pattern
- Test with actual artifacts
- Deploy functions: `supabase functions deploy`
- Monitor logs: `supabase functions logs`

## Section 4: Common Patterns

### 4.1 Contact Management
- Users are stored as special contacts with `is_self_contact = true`
- All relationship data flows through the contacts table
- Use `get_or_create_self_contact()` helper function

### 4.2 Artifact Processing
- All artifacts flow through unified `parse-artifact` function
- Specialization via internal routing, not separate functions
- Status tracking: `pending` → `processing` → `completed`/`failed`

### 4.3 Type Safety
- Always regenerate types after schema changes
- Use proper interfaces for all data structures
- Handle nullable database fields appropriately

Remember: This architecture has been battle-tested across multiple artifact types (voice memos, emails, meetings, LinkedIn posts). Follow the established patterns rather than creating new ones. 

## Section 5: Recent Fixes & Patterns

### 5.1 Edge Function Architecture Fix (User Profile Foundations)

**Issue**: During user profile foundations implementation, we initially created a separate `parse-voice-memo` edge function for specialized onboarding voice memo processing. This violated the established unified architecture pattern.

**Root Cause**: The system already had a unified `parse-artifact` function that handles ALL artifact AI processing via internal routing, but we created a specialized function instead of following the established pattern.

**Solution**: Integrated the specialized onboarding logic into the unified `parse-artifact` function:

1. **Added detection logic** in `parse-artifact/index.ts`:
   ```typescript
   const isOnboardingMemo = contact.is_self_contact && 
                           (artifact.metadata?.is_onboarding === 'true' || 
                            artifact.metadata?.source === 'onboarding_voice_recorder');
   ```

2. **Added routing logic**:
   ```typescript
   if (isOnboardingMemo) {
     aiParseResult = await parseOnboardingVoiceMemo(contentToAnalyze, contact, metadata);
   } else {
     aiParseResult = await parseWithOpenAI(contentToAnalyze, contact, artifact);
   }
   ```

3. **Added specialized function** directly in `parse-artifact/index.ts` for user profile extraction

4. **Updated all callers** to use unified function:
   - Debug endpoints: `parse-artifact` instead of `parse-voice-memo`
   - Transcription function: calls `parse-artifact` instead of `parse-voice-memo`

**Key Lesson**: Always follow the established unified architecture. The database triggers call `parse-artifact` for ALL artifact types, and specialization happens via internal routing, not separate functions.

**Files Modified**:
- `supabase/functions/parse-artifact/index.ts` (added onboarding logic)
- `supabase/functions/transcribe-voice-memo/index.ts` (updated to call unified function)
- `src/app/api/debug/voice-memo-status/route.ts` (updated debug endpoint)

**Removed**: `supabase/functions/parse-voice-memo/` (specialized function removed - functionality integrated into unified parse-artifact)

Remember: This architecture has been battle-tested across multiple artifact types (voice memos, emails, meetings, LinkedIn posts). Follow the established patterns rather than creating new ones. 