CREATE TABLE public.future_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  body text NOT NULL,
  written_during text NOT NULL, -- 'crash' or 'ath'
  deliver_during text NOT NULL, -- 'ath' or 'crash' (opposite)
  btc_price_at_write numeric NOT NULL,
  written_at timestamp with time zone NOT NULL DEFAULT now(),
  delivered_at timestamp with time zone,
  delivered boolean NOT NULL DEFAULT false,
  btc_price_at_delivery numeric
);

ALTER TABLE public.future_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own letters"
  ON public.future_letters FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own letters"
  ON public.future_letters FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own letters"
  ON public.future_letters FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);