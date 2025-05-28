# Close-Out Checklist for Coding Sessions

This document outlines the steps to take at the end of every coding session to ensure work is properly saved, documented, and integrated for Connection OS.

## 1. Finalize and Test Code Changes

- **Complete Development**: Ensure all coding for the current task, feature, or bugfix is finished.
- **Clean Code**: Remove any temporary debugging statements (e.g., `console.log`s), commented-out old code, etc.
- **TypeScript Validation**: Run TypeScript compilation to ensure no type errors:
  ```bash
  npx tsc --noEmit
  ```
- **Lint and Format**: Run linters (e.g., ESLint) and code formatters (e.g., Prettier) to ensure code style consistency.
  ```bash
  # Example: npm run lint && npm run format
  ```
- **Test Thoroughly**:
    - Run all relevant unit tests and ensure they pass.
    - Perform manual testing of the implemented feature or bugfix to confirm correct behavior and a good user experience.
    - Test on different screen sizes/devices if UI changes were made.
- **Performance Check**: Verify that new features don't introduce performance regressions:
    - Check bundle size impact for significant additions
    - Test loading times for new pages/components
    - Verify database query performance if schema changes were made

## 2. Database Schema Updates (If Applicable)

If you made changes to the database schema:

- **Verify Migration File**: Ensure your new or modified migration file in `supabase/migrations/` is correctly written and named (e.g., `YYYYMMDDHHMMSS_my_schema_change.sql`).
- **Test Migration Locally**: If possible, test the migration on a local/staging environment first.
- **Push to Cloud Database**: Apply the migration to your linked Supabase cloud project.
  ```bash
  echo "Y" | npx supabase db push
  ```
- **Regenerate Types**: Update TypeScript types after schema changes:
  ```bash
  npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
  ```
- **Verify RLS Policies**: Ensure Row Level Security policies are properly configured for new tables.

## 3. Dependencies and Security

- **Dependency Updates**: Check if any new dependencies were added and ensure they're properly documented:
  ```bash
  npm audit
  ```
- **Environment Variables**: If new environment variables were added, update `.env.example` and relevant documentation.
- **Security Review**: Ensure no sensitive data (API keys, passwords, etc.) is committed to the repository.

## 4. Update Project Documentation

Keep project documentation current with your changes.

- **`CHANGELOG.md`**:
    - Add a new entry summarizing the changes. Use conventional commit types (e.g., `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`).
    - Example: `feat(contacts): Add ability to filter contacts by tag`
    - Include any breaking changes or migration notes
- **`APPINDEX.md`**:
    - If you added or significantly modified pages, components, routes, or overall application structure, update `APPINDEX.md` to reflect these changes.
    - Document new API endpoints or significant architectural changes
- **Component Documentation**: Update JSDoc comments for new or modified components, especially public interfaces.
- **Other Documentation**:
    - Review if any JSDoc comments within the code need updates.
    - Check if `README.md` or other specific documentation files require changes (e.g., new environment variables, setup steps).
    - Update `TODO.md` to remove completed items and add new ones if discovered.

## 5. Code Quality and Architecture Review

- **Code Review Self-Check**: Review your own code as if you were reviewing someone else's:
    - Are variable and function names clear and descriptive?
    - Is the code following established patterns in the codebase?
    - Are there any obvious optimizations or refactoring opportunities?
- **Error Handling**: Ensure proper error handling is in place for new features.
- **Accessibility**: Verify that UI changes meet accessibility standards (ARIA labels, keyboard navigation, etc.).
- **Mobile Responsiveness**: Test that new UI components work well on mobile devices.

## 6. Git Workflow: Commit, Push, and Merge

Follow these steps to integrate your work into the main codebase.

- **Commit Changes to Your Feature/Bugfix Branch**:
    - Stage relevant files: `git add .` or `git add <specific-file-1> <specific-file-2>`
    - Commit with a descriptive message following conventional commit standards:
      ```bash
      git commit -m "type(scope): Your detailed commit message"
      ```
      (e.g., `feat(auth): implement password reset functionality`)
- **Push Your Branch to Remote**: Ensure your local commits are on the remote repository.
  ```bash
  git push origin <your-branch-name>
  ```
  (e.g., `git push origin feature/password-reset`)
- **Create a Pull Request (PR)**:
    - Navigate to your Git hosting platform (e.g., GitHub).
    - Create a new PR from your branch to the `main` branch (or your project's primary integration branch, like `develop`).
    - Provide a clear title and description for the PR. Detail the changes, the reasoning, and any testing instructions. Link to relevant issues if applicable.
    - Include screenshots or videos for UI changes.
    - Add appropriate labels and assign reviewers if applicable.
- **Code Review & Address Feedback (If applicable)**:
    - If your project uses a code review process, wait for reviewers to check your code.
    - Address any comments or requested changes by pushing new commits to your feature branch.
- **Merge the Pull Request**: 
    - Once the PR is approved and any automated checks (CI/CD) pass, merge it into the `main` branch.
    - Prefer using "Squash and merge" or "Rebase and merge" if your team prefers a cleaner commit history on `main`.
- **Update Local `main` Branch**: Keep your local `main` branch synchronized.
  ```bash
  git checkout main
  git pull origin main
  ```
- **Delete Feature Branch (Recommended)**:
    - **Locally**:
      ```bash
      git branch -d <your-branch-name>
      ```
    - **Remotely**: This is often an option on the Git hosting platform after the PR is merged.

## 7. Post-Merge Verification

- **Deployment Check**: If auto-deployment is configured, verify the changes deployed successfully.
- **Production Smoke Test**: Perform a quick test of the main functionality in the production environment.
- **Monitor for Issues**: Keep an eye on error logs and user feedback for any issues introduced by the changes.

## 8. Session Reflection & Next Steps

- **Review Accomplishments**: Briefly note what was completed during the session.
- **Document Learnings**: Note any new patterns, solutions, or insights discovered during development.
- **Plan for Next Session**: Identify any follow-up tasks or the next steps for the project/feature. This can be updating a `TODO.md` file, a project management tool, or personal notes.
- **Technical Debt**: Note any technical debt introduced or resolved during the session.

---

By consistently following this close-out checklist, you help maintain a clean, well-documented, and stable codebase. 