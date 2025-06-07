# Superseded Migrations

This directory contains migrations that have been superseded by consolidated versions.

## Email AI Processing Feature (June 5-7, 2025)

**Original Migrations (superseded):**
- `20250604221608_cleanup_duplicate_emails.sql` - Duplicate email cleanup and sync jobs
- `20250605005455_add_email_ai_processing.sql` - Initial AI processing setup
- `20250605010731_fix_email_ai_trigger.sql` - Hardcoded URL fix
- `20250605010904_fix_email_trigger_param.sql` - Parameter name fix (artifactId)
- `20250605011321_fix_http_post_call.sql` - Correct net.http_post signature
- `20250605011706_debug_email_trigger.sql` - Added debugging and error handling

**Consolidated Into:**
- `20250607131723_consolidated_email_ai_processing.sql` - All functionality combined
- `20250607131724_rollback_email_ai_migrations.sql` - Rollback of old versions
- `20250607132700_reapply_consolidated_email_ai.sql` - Final working version

## Why Consolidated?

During development of the email AI processing feature, multiple iterations were needed to debug and fix issues with the database triggers. This resulted in 6 separate migrations that represented incremental fixes rather than clean feature additions.

The consolidated migrations provide:
1. **Cleaner migration history**: Single source of truth for the feature
2. **Easier maintenance**: One place to understand the complete functionality
3. **Better documentation**: Comprehensive comments explaining all parts
4. **Reduced complexity**: No need to trace through multiple debugging iterations

## Migration Safety

- All original migrations were already applied to the production database
- The rollback migration safely removed the old implementations
- The consolidated migration reapplies the functionality cleanly
- No data was lost during the consolidation process
- All functionality remains identical to the final working state

## Historical Note

These files are kept for historical reference and audit purposes. They show the development process and debugging steps that led to the final working implementation. 