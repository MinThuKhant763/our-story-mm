DELETE FROM auth_sessions;
DELETE FROM auth_tokens;
DELETE FROM viewer_sessions;
DELETE FROM auth_limits;
DELETE FROM pin_attempts;
DELETE FROM job_leases;
UPDATE profiles SET renewal_reminders=0, opening_notifications=0;
UPDATE reminder_deliveries SET status='cancelled' WHERE status='pending';
UPDATE gift_openings SET email_status='cancelled' WHERE email_status='pending';
