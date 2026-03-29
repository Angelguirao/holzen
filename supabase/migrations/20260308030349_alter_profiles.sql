ALTER TABLE public.profiles
  ADD COLUMN hold_goal_type text DEFAULT NULL,
  ADD COLUMN hold_goal_start timestamptz DEFAULT NULL,
  ADD COLUMN hold_goal_target_months integer DEFAULT NULL,
  ADD COLUMN hold_goal_target_price numeric DEFAULT NULL,
  ADD COLUMN hold_goal_currency text DEFAULT 'USD';