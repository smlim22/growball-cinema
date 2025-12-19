CREATE TABLE IF NOT EXISTS notification_log (
    id BIGSERIAL PRIMARY KEY,
    showtime_id INTEGER NOT NULL REFERENCES showtimes(showtime_id),
    notification_type VARCHAR(50) NOT NULL DEFAULT 'feedback_request',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    response_data JSONB,
    UNIQUE(showtime_id, notification_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_log_showtime 
ON notification_log(showtime_id, notification_type);

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION send_feedback_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    showtime_record RECORD;
    edge_function_url TEXT;
    supabase_anon_key TEXT;
    response TEXT;
BEGIN
    -- Set your Supabase project URL and anon key
    -- IMPORTANT: Replace these with your actual values
    edge_function_url := 'https://kkfjxsvnmgrmhtceaqty.supabase.co/functions/v1/send-feedback-notification';
    supabase_anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZmp4c3ZubWdybWh0Y2VhcXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMDQyNjgsImV4cCI6MjA3NTg4MDI2OH0.edaLxos7JtdD4S1dHHDvVf_oLUnhTAsFuyCY-6ZW310';

    -- Find showtimes that ended 5 minutes ago and haven't been notified yet
    FOR showtime_record IN
        SELECT 
            s.showtime_id,
            s.date,
            s.time,
            m.movie_name,
            m.duration
        FROM showtimes s
        JOIN movie m ON s.movie_id = m.movie_id
        WHERE 
            -- Showtime ended approximately 5 minutes ago
            -- Calculate end time: date + time + duration
            (s.date + s.time + (m.duration || ' minutes')::INTERVAL) 
            BETWEEN (NOW() - INTERVAL '6 minutes') AND (NOW() - INTERVAL '4 minutes')
            -- Not already notified
            AND NOT EXISTS (
                SELECT 1 
                FROM notification_log nl 
                WHERE nl.showtime_id = s.showtime_id 
                AND nl.notification_type = 'feedback_request'
            )
            -- Only for available showtimes (not cancelled)
            AND s.status = 'Available'
    LOOP
        BEGIN
            -- Call the Edge Function using http extension
            -- Note: Requires the http extension to be enabled
            SELECT content::TEXT INTO response
            FROM http((
                'POST',
                edge_function_url,
                ARRAY[
                    http_header('Authorization', 'Bearer ' || supabase_anon_key),
                    http_header('Content-Type', 'application/json')
                ],
                'application/json',
                json_build_object(
                    'showtime_id', showtime_record.showtime_id,
                    'movie_name', showtime_record.movie_name
                )::TEXT
            )::http_request);

            -- Log the notification
            INSERT INTO notification_log (showtime_id, notification_type, status, response_data)
            VALUES (
                showtime_record.showtime_id,
                'feedback_request',
                'sent',
                response::JSONB
            )
            ON CONFLICT (showtime_id, notification_type) DO NOTHING;

            RAISE NOTICE 'Notification sent for showtime_id: %, movie: %', 
                showtime_record.showtime_id, showtime_record.movie_name;

        EXCEPTION WHEN OTHERS THEN
            -- Log failed notification
            INSERT INTO notification_log (showtime_id, notification_type, status, response_data)
            VALUES (
                showtime_record.showtime_id,
                'feedback_request',
                'failed',
                json_build_object('error', SQLERRM)::JSONB
            )
            ON CONFLICT (showtime_id, notification_type) DO NOTHING;

            RAISE WARNING 'Failed to send notification for showtime_id: %. Error: %', 
                showtime_record.showtime_id, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- Enable the http extension (required for calling Edge Functions)
-- Note: In Supabase, you may need to enable this via the dashboard:
-- Dashboard > Database > Extensions > Search for "http" > Enable
CREATE EXTENSION IF NOT EXISTS http;

-- Schedule the cron job to run every minute
-- The function will check for showtimes that ended 5 minutes ago
SELECT cron.schedule(
    'send-feedback-notifications',  -- Job name
    '* * * * *',                     -- Run every minute (cron expression)
    $$SELECT send_feedback_notifications();$$  -- SQL command to execute
);