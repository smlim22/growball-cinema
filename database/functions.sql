-- Automated function
CREATE OR REPLACE FUNCTION update_showtime_status()
RETURNS void
LANGUAGE sql
AS $$
  UPDATE showtimes
  SET status = 'Unavailable'
  WHERE
    -- 1. Combine date and time into a proper timestamp
    (
      (showtimes.date::text || ' ' || showtimes.time::text)::timestamp 
      AT TIME ZONE 'Asia/Kuala_Lumpur' -- 2. Tell Postgres this is MY timezone
    ) 
    
    < NOW() -- 3. Compare it to the current time (which is in UTC)
    
    -- And only update rows that need it
    AND status != 'Unavailable';
$$;

-- Automate to set the group booking status to 'inactive' after 30 minutes
select
  cron.schedule(
    'expire_group_bookings_30min',
    '*/1 * * * *', -- runs every 1 minute
    $$
    update GroupBooking
    set status = 'inactive'
    where status = 'active'
    and created_at <= now() - interval '30 minutes';
    $$
  );
