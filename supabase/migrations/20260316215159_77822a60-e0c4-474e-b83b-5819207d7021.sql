
-- Cache table for CoinGecko historical BTC prices (one row per date)
CREATE TABLE public.btc_price_cache (
  date text NOT NULL PRIMARY KEY,
  price numeric NOT NULL,
  fetched_at timestamp with time zone NOT NULL DEFAULT now()
);

-- No RLS needed — this is a shared read-only cache written by edge functions
ALTER TABLE public.btc_price_cache ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Anyone can read price cache"
  ON public.btc_price_cache FOR SELECT
  TO authenticated
  USING (true);

-- Service role inserts via edge function (no INSERT policy needed for anon/authenticated)
