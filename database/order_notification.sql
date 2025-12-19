CREATE TABLE IF NOT EXISTS order_notification_log (
    id BIGSERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES "order"(order_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'order_ready',
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_data JSONB,
    error_message TEXT,
    CONSTRAINT unique_order_notification UNIQUE(order_id, notification_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_notification_log_order_id 
ON order_notification_log(order_id);

CREATE INDEX IF NOT EXISTS idx_order_notification_log_sent_at 
ON order_notification_log(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_notification_log_status 
ON order_notification_log(status);

-- Create the trigger function
CREATE OR REPLACE FUNCTION notify_order_status_change()
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
    -- Only send notification when status changes to 'Ready'
    IF NEW.status = 'Ready For Pickup' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        
        -- Check if notification already sent for this order
        SELECT EXISTS(
            SELECT 1 
            FROM order_notification_log 
            WHERE order_id = NEW.order_id 
            AND notification_type = 'order_ready'
            AND status = 'sent'
        ) INTO notification_exists;
        
        -- Skip if already notified
        IF notification_exists THEN
            RAISE NOTICE 'Notification already sent for order_id: %', NEW.order_id;
            RETURN NEW;
        END IF;
        
        -- Set your Supabase project URL and anon key
        -- IMPORTANT: Replace with your actual values
        edge_function_url := 'https://kkfjxsvnmgrmhtceaqty.supabase.co/functions/v1/send-order-notification';
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
                    'order_id', NEW.order_id,
                    'status', NEW.status
                )::TEXT
            )::http_request);
            
            -- Log successful notification
            INSERT INTO order_notification_log (
                order_id,
                notification_type,
                status,
                response_data
            )
            VALUES (
                NEW.order_id,
                'order_ready',
                'sent',
                response_data
            )
            ON CONFLICT (order_id, notification_type) 
            DO UPDATE SET
                status = 'sent',
                sent_at = NOW(),
                response_data = EXCLUDED.response_data;
            
            RAISE NOTICE 'Notification sent successfully for order_id: %', NEW.order_id;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log failed notification but don't block the order update
            INSERT INTO order_notification_log (
                order_id,
                notification_type,
                status,
                error_message
            )
            VALUES (
                NEW.order_id,
                'order_ready',
                'failed',
                SQLERRM
            )
            ON CONFLICT (order_id, notification_type) 
            DO UPDATE SET
                status = 'failed',
                sent_at = NOW(),
                error_message = EXCLUDED.error_message;
            
            RAISE WARNING 'Failed to send notification for order_id: %. Error: %', 
                NEW.order_id, SQLERRM;
        END;
    END IF;
    
    -- Always return NEW to allow the update to proceed
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS order_status_update_trigger ON "order";

CREATE TRIGGER order_status_update_trigger
    AFTER UPDATE OF status ON "order"
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_status_change();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON order_notification_log TO postgres;
GRANT USAGE, SELECT ON SEQUENCE order_notification_log_id_seq TO postgres;