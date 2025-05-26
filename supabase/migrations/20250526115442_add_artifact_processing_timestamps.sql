ALTER TABLE public.artifacts 
ADD COLUMN IF NOT EXISTS ai_processing_started_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_processing_completed_at TIMESTAMPTZ DEFAULT NULL;

-- First, drop the trigger that depends on the function
DROP TRIGGER IF EXISTS on_transcription_complete ON public.artifacts;

-- Then, drop the existing trigger function if it exists
DROP FUNCTION IF EXISTS public.trigger_ai_parsing();

-- New function to handle setting the ai_processing_started_at timestamp
CREATE OR REPLACE FUNCTION public.handle_artifact_ai_processing_start()
RETURNS TRIGGER AS $$
BEGIN
  -- This trigger sets the start time when a voice memo is inserted
  -- or when its ai_parsing_status is explicitly updated to 'processing'.
  -- The edge function might be a more precise place to set this if the actual start
  -- of processing is decoupled from these specific database events.

  IF (TG_OP = 'INSERT' AND NEW.type = 'voice_memo' AND NEW.ai_processing_started_at IS NULL) THEN
    -- Potentially set on insert if processing is meant to start immediately
    -- NEW.ai_processing_started_at = NOW(); 
    -- However, usually an edge function picks it up, so the edge function should set this.
    -- For now, we'll rely on an explicit update or the edge function setting it.
  END IF;

  IF (TG_OP = 'UPDATE' AND NEW.type = 'voice_memo') THEN
    -- If ai_parsing_status transitions to 'processing' and start time isn't set
    IF (OLD.ai_parsing_status IS DISTINCT FROM NEW.ai_parsing_status AND 
        NEW.ai_parsing_status = 'processing' AND 
        NEW.ai_processing_started_at IS NULL) THEN
      NEW.ai_processing_started_at = NOW();
    END IF;

    -- If reprocess is triggered, explicitly set ai_processing_started_at and clear completed_at
    -- This assumes a reprocess action might nullify ai_parsing_status or set it to 'pending'/'processing'
    -- and also nullify ai_processing_completed_at before this trigger fires.
    -- The API route for reprocessing should set ai_processing_started_at = NOW() and ai_processing_completed_at = NULL.
    -- This trigger might be redundant if API does it, but can serve as a fallback.
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger before creating a new one to avoid errors
DROP TRIGGER IF EXISTS set_ai_processing_start_time ON public.artifacts;

CREATE TRIGGER set_ai_processing_start_time
BEFORE UPDATE ON public.artifacts -- Changed from INSERT OR UPDATE to just UPDATE
FOR EACH ROW
WHEN (OLD.ai_parsing_status IS DISTINCT FROM NEW.ai_parsing_status OR OLD.ai_processing_started_at IS DISTINCT FROM NEW.ai_processing_started_at)
EXECUTE FUNCTION public.handle_artifact_ai_processing_start();

-- Note on `ai_processing_started_at`:
-- The most reliable way to set `ai_processing_started_at` is for the system component that *begins* the AI processing
-- (e.g., the /api/voice-memo/[id]/reprocess route handler or the parse-voice-memo edge function)
-- to explicitly update this field for the specific artifact to NOW().
-- The trigger above is a more general attempt but might not capture all scenarios or might fire too broadly.

-- `ai_processing_completed_at` will be set by the `parse-voice-memo` edge function upon completion or failure. 