-- Optional attribution when an essay was republished (e.g. Nakamoto Institute mirroring Substack).
ALTER TABLE public.content_library
  ADD COLUMN IF NOT EXISTS original_url text,
  ADD COLUMN IF NOT EXISTS original_publication text;

COMMENT ON COLUMN public.content_library.original_url IS
  'Canonical / first-publication URL when different from url (e.g. Substack original).';
COMMENT ON COLUMN public.content_library.original_publication IS
  'Human label for the original outlet (e.g. The Bitstein Brief).';
