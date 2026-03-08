
ALTER TABLE public.library_items
ADD COLUMN status text NOT NULL DEFAULT 'unread';
