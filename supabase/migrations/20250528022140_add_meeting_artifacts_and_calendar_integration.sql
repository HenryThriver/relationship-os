-- Add meeting type to artifact enum (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'meeting' AND enumtypid = 'public.artifact_type_enum'::regtype) THEN
    ALTER TYPE public.artifact_type_enum ADD VALUE 'meeting';
  END IF;
END;
$$;

-- Table for storing user integration tokens
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    scopes TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, integration_type)
);

-- Add updated_at trigger for user_integrations
CREATE TRIGGER on_user_integrations_updated
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Table for tracking calendar sync status
CREATE TABLE IF NOT EXISTS public.calendar_sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_completed_at TIMESTAMP WITH TIME ZONE,
    events_processed INTEGER DEFAULT 0,
    artifacts_created INTEGER DEFAULT 0,
    contacts_updated UUID[] DEFAULT '{}',
    errors JSONB DEFAULT '[]',
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}'
);

-- Add comments for documentation
COMMENT ON TABLE public.user_integrations IS 'Stores OAuth tokens and metadata for external service integrations like Google Calendar';
COMMENT ON COLUMN public.user_integrations.integration_type IS 'Type of integration (e.g., google_calendar, outlook, etc.)';
COMMENT ON COLUMN public.user_integrations.scopes IS 'Array of OAuth scopes granted for this integration';
COMMENT ON COLUMN public.user_integrations.metadata IS 'Additional integration-specific metadata';

COMMENT ON TABLE public.calendar_sync_logs IS 'Tracks calendar synchronization operations and their results';
COMMENT ON COLUMN public.calendar_sync_logs.contacts_updated IS 'Array of contact UUIDs that were updated during this sync';
COMMENT ON COLUMN public.calendar_sync_logs.errors IS 'Array of error objects encountered during sync';

-- Enable RLS for user_integrations
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own integrations
CREATE POLICY "Users can manage their own integrations"
ON public.user_integrations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS for calendar_sync_logs
ALTER TABLE public.calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sync logs
CREATE POLICY "Users can view their own sync logs"
ON public.calendar_sync_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: System can insert sync logs for users
CREATE POLICY "System can insert sync logs"
ON public.calendar_sync_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: System can update sync logs for users
CREATE POLICY "System can update sync logs"
ON public.calendar_sync_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Utility function to get user's active integration
CREATE OR REPLACE FUNCTION public.get_user_integration(
    p_user_id UUID,
    p_integration_type TEXT
)
RETURNS TABLE (
    id UUID,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    scopes TEXT[],
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.id,
        ui.access_token,
        ui.refresh_token,
        ui.token_expires_at,
        ui.scopes,
        ui.metadata
    FROM public.user_integrations ui
    WHERE ui.user_id = p_user_id 
    AND ui.integration_type = p_integration_type
    AND ui.access_token IS NOT NULL;
END;
$$;

-- Utility function to upsert user integration
CREATE OR REPLACE FUNCTION public.upsert_user_integration(
    p_user_id UUID,
    p_integration_type TEXT,
    p_access_token TEXT,
    p_refresh_token TEXT DEFAULT NULL,
    p_token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_scopes TEXT[] DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    integration_id UUID;
BEGIN
    INSERT INTO public.user_integrations (
        user_id,
        integration_type,
        access_token,
        refresh_token,
        token_expires_at,
        scopes,
        metadata
    )
    VALUES (
        p_user_id,
        p_integration_type,
        p_access_token,
        p_refresh_token,
        p_token_expires_at,
        p_scopes,
        p_metadata
    )
    ON CONFLICT (user_id, integration_type)
    DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expires_at = EXCLUDED.token_expires_at,
        scopes = EXCLUDED.scopes,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING id INTO integration_id;
    
    RETURN integration_id;
END;
$$; 