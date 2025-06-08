# Centralized Artifact Processing Architecture

## Overview

Relationship OS implements a unified, extensible artifact processing system that automatically handles AI processing and suggestion generation for all artifact types. This architecture was designed to eliminate code duplication, ensure consistent user experience, and enable rapid addition of new relationship intelligence sources.

## Core Components

### 1. Configuration-Driven Processing Rules

**Database Table**: `artifact_processing_config`

```sql
CREATE TABLE public.artifact_processing_config (
  artifact_type TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  requires_content BOOLEAN DEFAULT false,
  requires_transcription BOOLEAN DEFAULT false,
  requires_metadata_fields TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current Configuration**:
- `voice_memo`: Requires completed transcription
- `meeting`: Requires content field
- `email`: Requires content field  
- `linkedin_post`: Requires metadata fields `["content", "author"]`
- `linkedin_profile`: Requires metadata fields `["about", "headline"]`

### 2. Unified Database Trigger

**Function**: `trigger_unified_artifact_ai_processing()`

This single trigger function replaces all previous type-specific triggers:
- ❌ `trigger_email_ai_processing()`
- ❌ `trigger_meeting_ai_processing()`  
- ❌ `trigger_ai_parsing()`
- ❌ `trigger_artifact_ai_processing()`

**Trigger Logic**:
1. Only processes artifacts with `ai_parsing_status = 'pending'`
2. Looks up processing configuration for artifact type
3. Validates readiness based on configuration rules
4. Triggers edge function if ready, logs if not ready

### 3. Dynamic Edge Function

**Function**: `parse-artifact`

The edge function now dynamically supports artifact types based on database configuration:

```typescript
// Before: Hardcoded type checking
const isVoiceMemo = fetchedArtifactRecord.type === 'voice_memo';
const isMeeting = fetchedArtifactRecord.type === 'meeting';
// ... hardcoded for each type

// After: Dynamic configuration lookup
const { data: processingConfig } = await supabase
  .from('artifact_processing_config')
  .select('*')
  .eq('artifact_type', fetchedArtifactRecord.type)
  .single();
```

### 4. Generic Reprocess Endpoint

**Endpoint**: `/api/artifacts/[id]/reprocess`

Unified reprocessing for all artifact types:
- Validates artifact type against configuration table
- Checks readiness requirements dynamically
- Resets AI processing status to trigger reprocessing

### 5. Standardized UI Components

**Component**: `ArtifactSuggestions`

Shared across all artifact modals:
- LinkedIn Posts (`LinkedInPostModal`)
- LinkedIn Profiles (`LinkedInProfileModal`)
- Emails (`EmailModal`)
- Voice Memos (`VoiceMemoModal`)
- Meetings (`EnhancedMeetingModal`)
- Loops (`EnhancedLoopModal`)
- Fallback (`ArtifactModal`)

**Features**:
- ✅ Processing status alerts with color-coded icons
- 📊 Suggestion count display
- 🔄 RE-ANALYZE button for reprocessing
- 👁️ Expandable suggestions sections
- 🧠 Individual suggestions with confidence scores

## Adding New Artifact Types

To add a new artifact type (e.g., `text_message`):

### 1. Update Database Enum (if needed)
```sql
ALTER TYPE artifact_type_enum ADD VALUE 'text_message';
```

### 2. Add Processing Configuration
```sql
INSERT INTO artifact_processing_config (
  artifact_type, 
  enabled, 
  requires_content, 
  requires_transcription, 
  requires_metadata_fields
) VALUES (
  'text_message', 
  true, 
  true, 
  false, 
  '["sender", "recipient"]'
);
```

### 3. Update Edge Function (Optional)
Only needed if special processing logic is required:

```typescript
// Add text message specific processing
if (fetchedArtifactRecord.type === 'text_message') {
  // Text message specific analysis
  contentToAnalyze = fetchedArtifactRecord.content;
  // Add sender/recipient context from metadata
}
```

### 4. Add UI Modal
Create modal component and include `ArtifactSuggestions`:

```typescript
export const TextMessageModal = ({ artifactId, contactId }: Props) => {
  return (
    <Dialog>
      {/* Modal content */}
      <ArtifactSuggestions 
        artifactId={artifactId}
        contactId={contactId}
      />
    </Dialog>
  );
};
```

**That's it!** The unified trigger, edge function, and reprocess endpoint automatically support the new type.

## Benefits

### For Developers
- **Reduced Code Duplication**: Single implementation for all types
- **Consistent Patterns**: Same trigger logic, UI components, and processing flow
- **Easier Maintenance**: Changes in one place affect all artifact types
- **Type Safety**: TypeScript interfaces ensure consistent artifact structure

### For Users
- **Consistent Experience**: Same UI patterns across all artifact types
- **Reliable Processing**: Unified error handling and status tracking
- **Feature Parity**: All artifact types get same features (reprocessing, suggestions, etc.)

### For Product
- **Rapid Prototyping**: New relationship intelligence sources can be added in minutes
- **A/B Testing**: Easy to enable/disable processing for specific types
- **Scalability**: Architecture supports unlimited artifact types
- **Data Consistency**: Standardized suggestion format across all types

## Migration History

This centralized architecture was introduced in version 0.10.0, consolidating:
- 7 LinkedIn Posts AI development migrations → 1 clean migration
- 4 separate trigger functions → 1 unified trigger
- Type-specific processing logic → Configuration-driven validation
- Inconsistent UI patterns → Shared component architecture

## Configuration Management

### Production Changes
```sql
-- Disable processing for a type
UPDATE artifact_processing_config 
SET enabled = false 
WHERE artifact_type = 'linkedin_post';

-- Add new metadata requirement
UPDATE artifact_processing_config 
SET requires_metadata_fields = '["content", "author", "engagement"]'
WHERE artifact_type = 'linkedin_post';
```

### Monitoring
```sql
-- Check processing status across types
SELECT 
  a.type,
  a.ai_parsing_status,
  COUNT(*) as count
FROM artifacts a
JOIN artifact_processing_config apc ON apc.artifact_type = a.type::text
WHERE apc.enabled = true
GROUP BY a.type, a.ai_parsing_status
ORDER BY a.type, a.ai_parsing_status;
```

This architecture represents a major milestone in Relationship OS development, transforming artifact processing from a collection of type-specific implementations into a unified, extensible system that scales with the product's growing relationship intelligence capabilities. 