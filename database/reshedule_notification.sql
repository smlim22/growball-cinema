CREATE TABLE IF NOT EXISTS showtime_notification_log (
    id BIGSERIAL PRIMARY KEY,
    showtime_id INTEGER NOT NULL REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'showtime_rescheduled',
    old_date DATE,
    old_time TIME,
    new_date DATE,
    new_time TIME,
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_data JSONB,
    error_message TEXT,
    affected_customers INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_showtime_notification_log_showtime_id 
ON showtime_notification_log(showtime_id);

CREATE INDEX IF NOT EXISTS idx_showtime_notification_log_sent_at 
ON showtime_notification_log(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_showtime_notification_log_status 
ON showtime_notification_log(status);

-- Step 3: Create the trigger function
CREATE OR REPLACE FUNCTION notify_showtime_reschedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    edge_function_url TEXT;
    supabase_anon_key TEXT;
    response_data JSONB;
    date_changed BOOLEAN;
    time_changed BOOLEAN;
BEGIN
    -- Check if date or time has actually changed
    date_changed := (OLD.date IS DISTINCT FROM NEW.date);
    time_changed := (OLD.time IS DISTINCT FROM NEW.time);
    
    -- Only send notification if date or time changed
    IF date_changed OR time_changed THEN
        
        -- Set your Supabase project URL and anon key
        -- IMPORTANT: Replace with your actual values
        edge_function_url := 'https://kkfjxsvnmgrmhtceaqty.supabase.co/functions/v1/send-showtime-notification';
        supabase_anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZmp4c3ZubWdybWh0Y2VhcXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMDQyNjgsImV4cCI6MjA3NTg4MDI2OH0.edaLxos7JtdD4S1dHHDvVf_oLUnhTAsFuyCY-6ZW310';
        
        BEGIN
            -- Call the Edge Function using http extension
            SELECT content::JSONB INTO response_data
            FROM http((
                'POST',
                edge_function_url,
                ARRAY[
                    http_header('Authorization', 'Bearer ' || supabase_anon_key),
                    http_header('Content-Type', 'application/json')
                ],
                'application/json',
                json_build_object(
                    'showtime_id', NEW.showtime_id,
                    'old_date', OLD.date,
                    'old_time', OLD.time,
                    'new_date', NEW.date,
                    'new_time', NEW.time
                )::TEXT
            )::http_request);
            
            -- Log successful notification
            INSERT INTO showtime_notification_log (
                showtime_id,
                notification_type,
                old_date,
                old_time,
                new_date,
                new_time,
                status,
                response_data,
                affected_customers
            )
            VALUES (
                NEW.showtime_id,
                'showtime_rescheduled',
                OLD.date,
                OLD.time,
                NEW.date,
                NEW.time,
                'sent',
                response_data,
                COALESCE((response_data->>'total')::INTEGER, 0)
            );
            
            RAISE NOTICE 'Reschedule notification sent for showtime_id: % (Date: % -> %, Time: % -> %)', 
                NEW.showtime_id, OLD.date, NEW.date, OLD.time, NEW.time;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log failed notification but don't block the showtime update
            INSERT INTO showtime_notification_log (
                showtime_id,
                notification_type,
                old_date,
                old_time,
                new_date,
                new_time,
                status,
                error_message
            )
            VALUES (
                NEW.showtime_id,
                'showtime_rescheduled',
                OLD.date,
                OLD.time,
                NEW.date,
                NEW.time,
                'failed',
                SQLERRM
            );
            
            RAISE WARNING 'Failed to send reschedule notification for showtime_id: %. Error: %', 
                NEW.showtime_id, SQLERRM;
        END;
    END IF;
    
    -- Always return NEW to allow the update to proceed
    RETURN NEW;
END;
$$;

-- Step 4: Create the trigger
DROP TRIGGER IF EXISTS showtime_update_trigger ON showtimes;

CREATE TRIGGER showtime_update_trigger
    AFTER UPDATE OF date, time ON showtimes
    FOR EACH ROW
    EXECUTE FUNCTION notify_showtime_reschedule();

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON showtime_notification_log TO postgres;
GRANT USAGE, SELECT ON SEQUENCE showtime_notification_log_id_seq TO postgres;