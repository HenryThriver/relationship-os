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

## 2. Environment Health Check

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

## 3. Get Current Timestamp for Migrations

If you anticipate making database schema changes, get the current timestamp for naming new migration files.

- **Command**:
  ```bash
  python3 -c 'import datetime; print(datetime.datetime.now().strftime("%Y%m%d%H%M%S"))'
  ```
  *Use the output of this command as the prefix for your new migration file name (e.g., `YYYYMMDDHHMMSS_my_migration_description.sql`).*

## 4. Review Core Project Documentation

Familiarize yourself with the current state and direction of the project.

- **`APPINDEX.md`**: Review to understand the current application structure, components, pages, and their relationships.
- **`ROADMAP.md`**: Review to align with the broader feature development plan and upcoming milestones.
- **`TODO.md`**: Check for any outstanding smaller tasks, bugs, or immediate priorities.
- **`BIGIDEA.md`**: Revisit to keep the overall project vision and core goals in mind.
- **`CHANGELOG.md`**: Review to be aware of the latest changes and updates merged into the project.

## 5. Review and Validate Database Schema

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

## 6. Artifact System Review

Review the current artifact system structure, especially when working on new artifact types.

- **Review Existing Artifact Types**: Check `src/types/` for current artifact interfaces and discriminated unions.
- **Check Artifact Database Schema**: Review recent migrations related to artifacts table structure.
- **Understand Artifact Patterns**: Recall the core artifact system patterns (timestamp, content, type, contact_id).

## 7. Integration-Specific Preparation

When working with external services or integrations, verify configurations and credentials.

- **Check Environment Variables**: Ensure all required API keys and configuration values are present in `.env.local`.
- **Verify API Credentials**: Test that external service credentials are valid and have proper scopes.
- **Review Rate Limits**: Be aware of any API rate limits or quotas for external services.
- **Check Integration Documentation**: Review any service-specific documentation or setup guides.

## 8. Recall Key Development Guidelines

Briefly mentally review the "Connection OS Development Rules" (often provided in the chat context or a project-specific rules file). Pay special attention to sections relevant to the task at hand, such as:
    - Tech Stack (Next.js, Supabase, MUI, Tailwind, Zustand, TanStack Query)
    - Project Structure
    - Code Style Preferences (TypeScript, React Patterns, Imports, Component Structure)
    - MUI + Tailwind Integration
    - Database Patterns (Supabase generated types, custom hooks, RLS)
    - Artifact System Patterns
    - Loop Management Patterns
    - Git Conventions

## 9. Setup Git Branch and Sync Local Environment

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

## 10. Define and Document Session Goal

Clearly articulate and document the primary objective for the current coding session.

- **Primary Objective**: What specific feature are you building?
- **Success Criteria**: What is the expected outcome or deliverable for this session?
- **Scope**: What bug are you fixing? What refactoring or improvement are you implementing?
- **Dependencies**: Are there any blockers or prerequisites that need to be addressed?
- **Session Context**: Document any relevant context, decisions, or constraints for future reference.

## 11. Session Documentation Template

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