-- ============================================================================
-- Content Library — local knowledge base for companion content generation
-- ============================================================================
--
-- Stores pre-indexed essays, papers, and historical events that generators
-- can search BEFORE calling Perplexity. This:
-- 1. Reduces Perplexity dependency (local first, API second)
-- 2. Ensures source attribution accuracy (every entry has verified author)
-- 3. Provides a manageable content catalog via the admin dashboard
--
-- Types:
-- - essay: Bitcoin philosophy essays (for Signal companion)
-- - paper: Academic research papers (for Grounding companion)
-- - event: Historical financial events (for History companion)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_library (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Content type determines which companion(s) can use this entry
  type text NOT NULL CHECK (type IN ('essay', 'paper', 'event')),
  
  -- Core content
  title text NOT NULL,
  author text,                    -- Verified author name
  summary text NOT NULL,          -- 2-5 sentence summary suitable for companion output
  url text,                       -- Source URL
  
  -- For essays (Signal companion)
  key_quote text,                 -- Memorable quote from the essay
  
  -- For papers (Grounding companion)
  citation text,                  -- Academic citation format "Author (Year), Title"
  finding text,                   -- Key research finding in plain language
  
  -- For events (History companion)
  event_date text,                -- Period/date string (e.g. "April 2013", "2000-2002")
  asset_class text,               -- Related asset class (e.g. "Gold", "Tech stocks")
  analogy text,                   -- Connection to Bitcoin
  recovery text,                  -- What happened after (the hopeful outcome)
  mood_tag text CHECK (mood_tag IN ('recovery', 'caution', 'neutral')),
  
  -- Metadata
  tags text[] DEFAULT '{}',       -- Searchable tags (e.g. ['patience', 'sovereignty'])
  companion_types text[] DEFAULT '{}', -- Which companions can use this ('signal', 'ground_nudge', etc.)
  language text DEFAULT 'en',
  quality_score integer DEFAULT 2,
  active boolean DEFAULT true,    -- Soft delete / disable
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for generator queries
CREATE INDEX IF NOT EXISTS idx_content_library_type ON content_library(type) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_content_library_tags ON content_library USING gin(tags) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_content_library_companion ON content_library USING gin(companion_types) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_content_library_mood ON content_library(mood_tag) WHERE type = 'event' AND active = true;

-- RLS
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Admins can manage content, anyone authenticated can read
CREATE POLICY "Admins can manage content library"
  ON content_library FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated users can read content library"
  ON content_library FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── Seed with initial content ──

-- Signal essays
INSERT INTO content_library (type, title, author, summary, url, key_quote, tags, companion_types) VALUES
('essay', 'Proof of work is proof of sacrifice', 'Gigi', 'Bitcoin''s proof-of-work mechanism mirrors a universal truth: nothing of value comes without cost. The energy expended isn''t wasted — it''s transformed into trust, the most scarce resource in human coordination.', 'https://21lessons.com/', 'Nothing of value comes without cost.', ARRAY['proof-of-work', 'sacrifice', 'trust'], ARRAY['signal']),
('essay', 'Sound money teaches patience before wealth', 'Saifedean Ammous', 'The hardest lesson Bitcoin teaches isn''t about returns — it''s about time preference. A society that saves in hard money naturally extends its planning horizon, building cathedrals instead of strip malls.', 'https://saifedean.com/thebitcoinstandard/', 'Hard money extends the planning horizon of civilization.', ARRAY['time-preference', 'patience', 'sound-money'], ARRAY['signal']),
('essay', 'Sovereignty begins with what you refuse to delegate', 'Parker Lewis', 'Holding your own keys isn''t a technical preference — it''s a philosophical stance. Every system that asks you to trust a third party is a system that can betray you.', 'https://unchained.com/gradually-then-suddenly/', 'Self-custody is the first act of self-sovereignty.', ARRAY['sovereignty', 'self-custody', 'trust'], ARRAY['signal']),
('essay', 'The price is the least interesting thing about Bitcoin', 'Allen Farrington', 'Fixating on price is like judging the printing press by the cost of paper. Bitcoin''s real innovation is the separation of money and state — a shift as consequential as the separation of church and state.', 'https://allenfarrington.medium.com/', NULL, ARRAY['separation', 'money-state', 'innovation'], ARRAY['signal']),
('essay', 'Volatility is the price of admission to a new monetary order', 'Vijay Boyapati', 'Every new monetary good must pass through a period of extreme volatility on its path to stable purchasing power. Gold was volatile for centuries. Bitcoin is compressing that journey into decades.', 'https://vijayboyapati.medium.com/the-bullish-case-for-bitcoin-6ecc8bdecc1', NULL, ARRAY['volatility', 'monetary-evolution', 'patience'], ARRAY['signal']);

-- Grounding papers
INSERT INTO content_library (type, title, author, summary, citation, finding, url, tags, companion_types) VALUES
('paper', 'Loss aversion doubles the sting', 'Kahneman & Tversky', 'Losses feel roughly twice as painful as equivalent gains feel good. When BTC drops 5%, your brain processes it as if you lost 10%. This asymmetry is hardwired.', 'Kahneman & Tversky (1979), Prospect Theory', 'Losses are weighted ~2x more than equivalent gains', 'https://scholar.google.com/scholar?q=kahneman+tversky+prospect+theory+1979', ARRAY['loss-aversion', 'prospect-theory'], ARRAY['ground_nudge']),
('paper', 'The disposition effect', 'Shefrin & Statman', 'Investors are 50% more likely to sell a winning position than a losing one. We lock in gains too early out of fear, and hold losses too long out of hope.', 'Shefrin & Statman (1985), The Disposition to Sell Winners Too Early', 'Investors sell winners 50% more often than losers', 'https://scholar.google.com/scholar?q=shefrin+statman+disposition+effect+1985', ARRAY['disposition-effect', 'selling-winners'], ARRAY['ground_nudge']),
('paper', 'Prefrontal cortex goes offline during financial stress', 'Lo & Repin', 'Market volatility triggers measurable autonomic nervous system responses that impair the prefrontal cortex''s capacity for rational decision-making.', 'Lo & Repin (2002), Psychophysiology of Real-Time Financial Risk', 'Volatility triggers physiological stress that impairs rational thinking', 'https://scholar.google.com/scholar?q=lo+repin+psychophysiology+financial+risk+2002', ARRAY['stress-response', 'emotional-regulation'], ARRAY['ground_nudge']);

-- Historical events
INSERT INTO content_library (type, title, author, summary, event_date, asset_class, analogy, recovery, mood_tag, tags, companion_types) VALUES
('event', 'Amazon lost 95% and became the everything store', NULL, 'From its 1999 peak of $106.69, Amazon crashed to $5.51 by 2001 — a 95% drawdown. The narrative shifted from ''world-changing'' to ''overvalued dot-com.''', '2000-2001', 'Tech stocks', 'Bitcoin has experienced five drawdowns of 70%+ in its history. Each time, the ''it''s dead'' narrative peaked at the bottom.', 'Amazon eventually reached $3,000+ and became one of the most valuable companies in history.', 'recovery', ARRAY['tech-crash', 'drawdown', 'recovery'], ARRAY['historical_insight']),
('event', 'The 2020 COVID crash recovered in 40 days', NULL, 'On March 12, 2020, Bitcoin fell from $7,900 to $3,800 in 24 hours — a 52% single-day crash. Yet within 40 days, BTC had recovered to pre-crash levels.', 'March 2020', 'S&P 500', 'The S&P 500 crashed 34% and fully recovered by August 2020. The speed of the crash rarely predicts the timeline of recovery.', 'Bitcoin set a new all-time high within 9 months of the crash.', 'recovery', ARRAY['covid', 'rapid-recovery', 'black-thursday'], ARRAY['historical_insight']),
('event', 'Gold crashed 26% in three days in 2013', NULL, 'Between April 12-15, 2013, gold plummeted from $1,560 to $1,321 per ounce. Panic sellers locked in generational losses.', 'April 2013', 'Gold', 'The same pattern preceded every major Bitcoin recovery: sharp fear, forced selling, then quiet accumulation.', 'Gold stabilized and eventually became a cornerstone of central bank reserves again.', 'recovery', ARRAY['gold', 'panic-selling', 'crash'], ARRAY['historical_insight']);
