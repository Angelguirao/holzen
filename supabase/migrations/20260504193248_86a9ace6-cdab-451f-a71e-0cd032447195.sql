-- Optional dev admin bootstrap (idempotent). Runs as migration superuser — do not use SET LOCAL ROLE
-- (breaks supabase db push migration recording on hosted Postgres).

UPDATE public.profiles
SET lifetime_access = true,
    subscription_status = 'lifetime',
    subscription_checked_at = now()
WHERE user_id = '7b74332c-5d57-4c37-ac6b-676ca3498fc1';
