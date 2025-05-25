# Git & GitHub Setup Guide for Relationship OS

This guide provides all the commands needed to set up Git, GitHub, and establish a proper development workflow.

## ✅ Completed Steps

- [x] Created comprehensive `.gitignore` file
- [x] Initialized Git repository
- [x] Made initial commit

## 🚀 GitHub Repository Setup

### Step 1: Create GitHub Repository

**Option A: Using GitHub CLI (Recommended)**
```bash
# Install GitHub CLI if not already installed (macOS)
brew install gh

# Authenticate with GitHub
gh auth login

# Create repository and push code
gh repo create relationship-os --public --description "A Relationship Intelligence System that transforms networking from overwhelming to systematic" --clone=false

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/relationship-os.git

# Push initial code
git branch -M main
git push -u origin main
```

**Option B: Manual GitHub Setup**
1. Go to [GitHub](https://github.com/new)
2. Repository name: `relationship-os`
3. Description: `A Relationship Intelligence System that transforms networking from overwhelming to systematic`
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

Then run these commands:
```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/relationship-os.git

# Rename default branch to main and push
git branch -M main
git push -u origin main
```

### Step 2: Verify Repository Setup
```bash
# Check remote configuration
git remote -v

# Check current branch
git branch

# Check repository status
git status
```

## 🌿 Branch Strategy & Development Workflow

### Create Development Branch Structure

```bash
# Create and switch to develop branch
git checkout -b develop

# Push develop branch to GitHub
git push -u origin develop

# Create initial feature branch example
git checkout -b feature/auth-setup
git push -u origin feature/auth-setup

# Return to develop branch
git checkout develop
```

### Branch Naming Conventions

Use these prefixes for different types of work:

- **Features**: `feature/description-of-feature`
  ```bash
  git checkout -b feature/contact-management
  git checkout -b feature/artifact-timeline
  git checkout -b feature/pog-system
  ```

- **Bug Fixes**: `fix/description-of-fix`
  ```bash
  git checkout -b fix/auth-redirect-issue
  git checkout -b fix/contact-search-performance
  ```

- **Documentation**: `docs/description`
  ```bash
  git checkout -b docs/api-documentation
  git checkout -b docs/setup-guide-updates
  ```

- **Refactoring**: `refactor/description`
  ```bash
  git checkout -b refactor/supabase-client-structure
  git checkout -b refactor/component-organization
  ```

- **Chores**: `chore/description`
  ```bash
  git checkout -b chore/update-dependencies
  git checkout -b chore/eslint-configuration
  ```

### Development Workflow Commands

**Starting New Feature Work:**
```bash
# Always start from latest develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature...
# Make commits with conventional commit messages

# Push feature branch
git push -u origin feature/your-feature-name
```

**Conventional Commit Messages:**
```bash
# Features
git commit -m "feat: add contact creation form with validation"
git commit -m "feat(auth): implement password reset functionality"

# Bug fixes
git commit -m "fix: resolve contact search performance issue"
git commit -m "fix(ui): correct mobile responsive layout"

# Documentation
git commit -m "docs: update API documentation for artifacts"
git commit -m "docs(readme): add deployment instructions"

# Refactoring
git commit -m "refactor: reorganize Supabase client structure"

# Chores
git commit -m "chore: update dependencies to latest versions"
git commit -m "chore(config): update ESLint rules"
```

**Merging Feature Back to Develop:**
```bash
# Switch to develop and update
git checkout develop
git pull origin develop

# Merge feature branch (use --no-ff to preserve branch history)
git merge --no-ff feature/your-feature-name

# Push updated develop
git push origin develop

# Delete local feature branch
git branch -d feature/your-feature-name

# Delete remote feature branch
git push origin --delete feature/your-feature-name
```

**Preparing Release (Develop → Main):**
```bash
# Switch to main and update
git checkout main
git pull origin main

# Merge develop into main
git merge --no-ff develop

# Tag the release
git tag -a v0.2.0 -m "Release v0.2.0: Core contact management system"

# Push main with tags
git push origin main --tags

# Switch back to develop for continued work
git checkout develop
```

## 🛡️ GitHub Branch Protection Setup

### Step 1: Set Up Branch Protection Rules

Go to your GitHub repository → Settings → Branches → Add rule

**For `main` branch:**
- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ✅ Restrict pushes that create files larger than 100MB
- ✅ Include administrators

**For `develop` branch:**
- Branch name pattern: `develop`
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators

### Step 2: Set Default Branch

Go to Settings → General → Default branch → Change to `develop`

This ensures new PRs default to the develop branch.

## 🔄 Pull Request Workflow

### Creating Pull Requests

```bash
# After pushing your feature branch
gh pr create --title "feat: add contact management system" --body "Implements core contact CRUD operations with Supabase integration" --base develop

# Or create PR manually on GitHub
```

### PR Template (Create `.github/pull_request_template.md`)

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Manual testing completed
- [ ] No console errors

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated if needed
- [ ] No merge conflicts
```

## 📊 Useful Git Commands

### Daily Development
```bash
# Check what's changed
git status
git diff

# Stage and commit changes
git add .
git commit -m "feat: your commit message"

# Push current branch
git push

# Pull latest changes
git pull

# Switch branches
git checkout branch-name

# Create and switch to new branch
git checkout -b new-branch-name
```

### Branch Management
```bash
# List all branches
git branch -a

# Delete local branch
git branch -d branch-name

# Delete remote branch
git push origin --delete branch-name

# Rename current branch
git branch -m new-branch-name
```

### Viewing History
```bash
# View commit history
git log --oneline --graph --decorate

# View changes in last commit
git show

# View file history
git log --follow filename
```

### Undoing Changes
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo changes to specific file
git checkout -- filename
```

## 🎯 Quick Reference

### Repository URLs
- **HTTPS**: `https://github.com/YOUR_USERNAME/relationship-os.git`
- **SSH**: `git@github.com:YOUR_USERNAME/relationship-os.git`

### Branch Structure
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature development
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Commit Message Format
```
type(scope): description

feat: new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructuring
test: adding tests
chore: maintenance
```

Remember to replace `YOUR_USERNAME` with your actual GitHub username in all commands! 