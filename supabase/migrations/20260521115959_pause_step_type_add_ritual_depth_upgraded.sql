-- Separate transaction so the new enum label is committed before functions/views reference it.
ALTER TYPE public.pause_step_type ADD VALUE IF NOT EXISTS 'ritual_depth_upgraded';
