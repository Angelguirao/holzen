-- Enum label must commit before any migration references it (PostgreSQL 55P04 if
-- `ALTER TYPE ... ADD VALUE` shares a transaction with views/functions using the label).

ALTER TYPE public.pause_step_type ADD VALUE IF NOT EXISTS 'post_pause_emotion_logged';
