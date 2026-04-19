-- Grant lifetime access to scabmaci@gmail.com (bypassing protect_subscription_fields trigger)
ALTER TABLE public.profiles DISABLE TRIGGER USER;

UPDATE public.profiles
SET lifetime_access = true,
    subscription_status = 'lifetime',
    subscription_end = NULL,
    subscription_checked_at = now(),
    updated_at = now()
WHERE user_id = '569a3b78-6ded-4e76-9998-78c31c4c6d1f';

ALTER TABLE public.profiles ENABLE TRIGGER USER;