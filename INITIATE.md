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

## 2. Get Current Timestamp for Migrations

If you anticipate making database schema changes, get the current timestamp for naming new migration files.

- **Command**:
  ```bash
  python3 -c 'import datetime; print(datetime.datetime.now().strftime("%Y%m%d%H%M%S"))'
  ```
  *Use the output of this command as the prefix for your new migration file name (e.g., `YYYYMMDDHHMMSS_my_migration_description.sql`).*

## 3. Review Core Project Documentation

Familiarize yourself with the current state and direction of the project.

- **`APPINDEX.md`**: Review to understand the current application structure, components, pages, and their relationships.
- **`ROADMAP.md`**: Review to align with the broader feature development plan and upcoming milestones.
- **`TODO.md`**: Check for any outstanding smaller tasks, bugs, or immediate priorities.
- **`BIGIDEA.md`**: Revisit to keep the overall project vision and core goals in mind.
- **`CHANGELOG.md`**: Review to be aware of the latest changes and updates merged into the project.

## 4. Review Supabase Migrations

Understand the current database schema and its evolution.

- **Command**:
  ```bash
  ls supabase/migrations
  ```
  *This helps in understanding the existing table structures, relationships, and any recent changes to the database schema.*

## 5. Recall Key Development Guidelines

Briefly mentally review the "Connection OS Development Rules" (often provided in the chat context or a project-specific rules file). Pay special attention to sections relevant to the task at hand, such as:
    - Tech Stack (Next.js, Supabase, MUI, Tailwind, Zustand, TanStack Query)
    - Project Structure
    - Code Style Preferences (TypeScript, React Patterns, Imports, Component Structure)
    - MUI + Tailwind Integration
    - Database Patterns (Supabase generated types, custom hooks, RLS)
    - Artifact System Patterns
    - Loop Management Patterns
    - Git Conventions

## 6. Setup Git Branch and Sync Local Environment

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

## 7. Define the Goal for the Session

Clearly articulate the primary objective for the current coding session.
- What specific feature are you building?
- What bug are you fixing?
- What refactoring or improvement are you implementing?
- What is the expected outcome or deliverable for this session?

---

By following these initiation steps, you can ensure consistency, stay aligned with project standards, and set a clear focus for each development session. 