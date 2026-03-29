
-- Delete existing BTC-focused learning sources
DELETE FROM public.signal_sources WHERE category = 'learning';

-- Insert behavioral finance / psychology grounding sources
INSERT INTO public.signal_sources (name, type, url, description, category) VALUES
  ('Daniel Kahneman', 'analyst', 'https://scholar.google.com/citations?user=p-onuUQAAAAJ', 'Nobel laureate — Prospect Theory, loss aversion, cognitive biases', 'grounding'),
  ('Behavioral Finance & Economics', 'blog', 'https://behavioralfinance.com', 'Research hub for behavioral finance studies and investor psychology', 'grounding'),
  ('The Decision Lab', 'blog', 'https://thedecisionlab.com', 'Applied behavioral science — cognitive biases, heuristics, nudge theory', 'grounding'),
  ('Farnam Street', 'blog', 'https://fs.blog', 'Mental models, decision-making frameworks, and second-order thinking', 'grounding'),
  ('Morgan Housel', 'analyst', 'https://collabfund.com/blog', 'Author of The Psychology of Money — behavioral finance essays', 'grounding'),
  ('Thinking, Fast and Slow', 'book', null, 'Daniel Kahneman — System 1 vs System 2 thinking and cognitive biases', 'grounding'),
  ('The Psychology of Money', 'book', null, 'Morgan Housel — How emotions and biases shape financial decisions', 'grounding'),
  ('Influence: The Psychology of Persuasion', 'book', null, 'Robert Cialdini — Social proof, anchoring, and persuasion in markets', 'grounding'),
  ('Choiceology', 'podcast', 'https://www.schwab.com/learn/podcast-choiceology', 'Behavioral economics podcast exploring irrational decision-making', 'grounding'),
  ('Hidden Brain', 'podcast', 'https://hiddenbrain.org', 'NPR — unconscious patterns driving human behavior and decisions', 'grounding'),
  ('Rational Reminder', 'podcast', 'https://rationalreminder.ca', 'Evidence-based investing, behavioral finance research discussions', 'grounding');

-- Update any existing user preferences from 'learning' to 'grounding' category
UPDATE public.user_signal_preferences SET category = 'grounding' WHERE category = 'learning';
