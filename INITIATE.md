# Initiation Checklist for New Coding Sessions / Features

This document outlines the steps to take at the beginning of every new coding session or when starting to build out a new feature for Connection OS.

## 1. Connect to Supabase Project

Ensure you are connected to the correct Supabase project.

- **Project ID**: `zepawphplcisievcdugz`
- **Login (if needed)**:
  ```bash
  npx supabase login
  ```
- **Link Project (if not already linked or to confirm)**:
  ```bash
  npx supabase link --project-ref zepawphplcisievcdugz
  ```
  *Note: Subsequent `supabase db push` commands will automatically apply to this linked cloud project.*

## 2. Database Access Patterns - MANDATORY REFERENCE

### 🔥 CRITICAL: Always Use Secure Dynamic Patterns for Database Operations

**🔒 SECURITY FIRST**: Never hardcode production credentials. Always retrieve them dynamically.

### Secure Connection String Retrieval
**ALWAYS use this to get current connection string dynamically**:
```bash
npx supabase db dump --linked --dry-run
```
This shows the exact connection string in the output. Extract the postgresql:// URL from the pg_dump command.

### Secure psql Access Patterns

**Option 1: Connection String Method (RECOMMENDED)**
```bash
# Get connection string dynamically
CONNECTION_STRING=$(npx supabase db dump --linked --dry-run 2>/dev/null | grep "postgresql://" | head -1)

# Use it securely
psql "$CONNECTION_STRING" -c "YOUR_SQL_QUERY_HERE"
```

**Option 2: Manual environment variables (when you need individual components)**
```bash
# First get credentials from: npx supabase db dump --linked --dry-run
# Then manually set environment variables from the output:
# PGHOST="[HOST_FROM_SUPABASE_OUTPUT]" PGPORT="[PORT]" PGUSER="[USER]" PGPASSWORD="[PASSWORD]" PGDATABASE="[DATABASE]" psql -c "YOUR_SQL_HERE"
```

### Common Database Operations Templates

**1. Table Structure Inspection**
```bash
# Get connection first
CONNECTION_STRING=$(npx supabase db dump --linked --dry-run 2>/dev/null | grep "postgresql://" | head -1)

# List all tables
psql "$CONNECTION_STRING" -c "\dt"

# Describe specific table
psql "$CONNECTION_STRING" -c "\d contacts"
```

**2. Data Analysis Queries**
```bash
# Get connection first
CONNECTION_STRING=$(npx supabase db dump --linked --dry-run 2>/dev/null | grep "postgresql://" | head -1)

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
CONNECTION_STRING=$(npx supabase db dump --linked --dry-run 2>/dev/null | grep "postgresql://" | head -1)

# Update specific contact field
psql "$CONNECTION_STRING" -c "UPDATE contacts SET company = 'New Company' WHERE id = 'CONTACT_ID';"

# Update JSON field
psql "$CONNECTION_STRING" -c "UPDATE contacts SET professional_context = '{\"projects_involved\": [\"Project Name\"]}' WHERE id = 'CONTACT_ID';"
```

**4. Migration and Schema Operations**
```bash
# Apply migration to cloud (auto-confirms)
echo "Y" | npx supabase db push

# Get timestamp for new migration files
python3 -c 'import datetime; print(datetime.datetime.now().strftime("%Y%m%d%H%M%S"))'

# Generate current types after schema changes
npx supabase gen types typescript --project-id zepawphplcisievcdugz > src/types/supabase.ts
```

**5. Debug-Specific Queries**
```bash
# Get connection first
CONNECTION_STRING=$(npx supabase db dump --linked --dry-run 2>/dev/null | grep "postgresql://" | head -1)

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
  npx supabase gen types typescript --project-id zepawphplcisievcdugz > src/types/supabase.ts
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