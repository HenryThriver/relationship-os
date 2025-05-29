-- Fix calendar_sync_logs RLS policies - Final Solution
-- File: supabase/migrations/20250528175659_fix_calendar_sync_logs_rls_final.sql

-- Drop ALL existing policies on calendar_sync_logs to start fresh
DROP POLICY IF EXISTS "Users can view their own sync logs" ON public.calendar_sync_logs;
DROP POLICY IF EXISTS "System can insert sync logs" ON public.calendar_sync_logs;
DROP POLICY IF EXISTS "System can update sync logs" ON public.calendar_sync_logs;
DROP POLICY IF EXISTS "Allow inserts for user sync logs" ON public.calendar_sync_logs;
DROP POLICY IF EXISTS "Allow updates for sync logs" ON public.calendar_sync_logs;
DROP POLICY IF EXISTS "Users and service can view sync logs" ON public.calendar_sync_logs;

-- Create clean, working RLS policies
CREATE POLICY "calendar_sync_logs_select" ON public.calendar_sync_logs
    FOR SELECT 
    TO authenticated, service_role
    USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "calendar_sync_logs_insert" ON public.calendar_sync_logs
    FOR INSERT 
    TO authenticated, service_role
    WITH CHECK (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "calendar_sync_logs_update" ON public.calendar_sync_logs
    FOR UPDATE 
    TO authenticated, service_role
    USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Fixed calendar_sync_logs RLS policies - manual sync should now work!';
END;
$$; 