-- Bootstrap changelog for owned Supabase projects so npm run check:version-sync passes
-- after first db push. Keep package.json version aligned when bumping releases.

SET search_path = public;

INSERT INTO public.changelog_entries (version, date, changes)
SELECT
  '1.0.0',
  to_char(timezone('utc', now()), 'YYYY-MM-DD'),
  ARRAY['Owned Supabase bootstrap (holzen-staging / holzen-prod)']
WHERE NOT EXISTS (SELECT 1 FROM public.changelog_entries LIMIT 1);
