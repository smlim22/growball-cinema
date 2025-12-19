-- Automated function for updating showtimes status
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

select
  cron.schedule(
    'update-showtime-status-job',
    '* * * * *',

    $$
      SELECT update_showtime_status();
    $$
  );

-- Automate to set the group booking status to 'inactive' after 30 minutes
select
  cron.schedule(
    'expire_group_bookings_30min',
    '* * * * *', -- runs every minute
    $$
    update group_booking
    set status = 'inactive'
    where status = 'active'
      and created_at <= now() - interval '30 minutes';
    $$
  );