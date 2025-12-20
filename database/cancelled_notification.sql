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

-- Ensure indexes exist (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_showtime_notification_log_showtime_id 
ON showtime_notification_log(showtime_id);

CREATE INDEX IF NOT EXISTS idx_showtime_notification_log_sent_at 
ON showtime_notification_log(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_showtime_notification_log_status 
ON showtime_notification_log(status);

CREATE INDEX IF NOT EXISTS idx_showtime_notification_log_type
ON showtime_notification_log(notification_type);

-- Create the trigger function
CREATE OR REPLACE FUNCTION notify_showtime_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    edge_function_url TEXT;
    supabase_anon_key TEXT;
    response_data JSONB;
    notification_exists BOOLEAN;
BEGIN
    -- Only send notification when status changes to 'Cancelled'
    IF NEW.status = 'Cancelled' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        
        -- Check if cancellation notification already sent for this showtime
        SELECT EXISTS(
            SELECT 1 
            FROM showtime_notification_log 
            WHERE showtime_id = NEW.showtime_id 
            AND notification_type = 'showtime_cancelled'
            AND status = 'sent'
        ) INTO notification_exists;
        
        -- Skip if already notified
        IF notification_exists THEN
            RAISE NOTICE 'Cancellation notification already sent for showtime_id: %', NEW.showtime_id;
            RETURN NEW;
        END IF;
        
        -- Set your Supabase project URL and anon key
        -- IMPORTANT: Replace with your actual values
        edge_function_url := 'https://kkfjxsvnmgrmhtceaqty.supabase.co/functions/v1/send-showtime-cancellation-notification';
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
                    'showtime_id', NEW.showtime_id
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
                'showtime_cancelled',
                NEW.date,
                NEW.time,
                NULL,
                NULL,
                'sent',
                response_data,
                COALESCE((response_data->>'total')::INTEGER, 0)
            );
            
            RAISE NOTICE 'Cancellation notification sent for showtime_id: % (Date: %, Time: %)', 
                NEW.showtime_id, NEW.date, NEW.time;
            
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
                'showtime_cancelled',
                NEW.date,
                NEW.time,
                NULL,
                NULL,
                'failed',
                SQLERRM
            );
            
            RAISE WARNING 'Failed to send cancellation notification for showtime_id: %. Error: %', 
                NEW.showtime_id, SQLERRM;
        END;
    END IF;
    
    -- Always return NEW to allow the update to proceed
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS showtime_cancellation_trigger ON showtimes;

CREATE TRIGGER showtime_cancellation_trigger
    AFTER UPDATE OF status ON showtimes
    FOR EACH ROW
    EXECUTE FUNCTION notify_showtime_cancellation();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON showtime_notification_log TO postgres;
GRANT USAGE, SELECT ON SEQUENCE showtime_notification_log_id_seq TO postgres;