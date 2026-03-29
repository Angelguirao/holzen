ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

-- Allow users to update their own reflections (for favorites)
CREATE POLICY "Users can update their own reflections"
ON public.reflections
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow profiles to be deleted (for account deletion via service role)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);