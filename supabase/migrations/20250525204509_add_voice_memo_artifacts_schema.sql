-- Add voice memo fields to existing artifacts table
ALTER TABLE public.artifacts ADD COLUMN IF NOT EXISTS audio_file_path TEXT;
ALTER TABLE public.artifacts ADD COLUMN IF NOT EXISTS transcription TEXT;
ALTER TABLE public.artifacts ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE public.artifacts ADD COLUMN IF NOT EXISTS transcription_status VARCHAR(20) DEFAULT 'pending';

-- Add voice_memo to artifact_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'artifact_type_enum' AND e.enumlabel = 'voice_memo') THEN
    ALTER TYPE public.artifact_type_enum ADD VALUE 'voice_memo';
  END IF;
END
$$;

-- Add index for transcription search
CREATE INDEX IF NOT EXISTS idx_artifacts_transcription ON public.artifacts USING GIN (to_tsvector('english', transcription));

-- Add constraint for transcription status
-- First, drop constraint if it exists, to make this idempotent
ALTER TABLE public.artifacts DROP CONSTRAINT IF EXISTS check_transcription_status;
ALTER TABLE public.artifacts ADD CONSTRAINT check_transcription_status 
  CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed'));

-- Insert storage bucket for voice memos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-memos', 
  'voice-memos', 
  false, 
  52428800, -- 50MB limit (50 * 1024 * 1024)
  ARRAY['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for voice memos bucket
CREATE POLICY "Users can upload their own voice memos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'voice-memos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own voice memos" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'voice-memos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own voice memos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-memos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
); 