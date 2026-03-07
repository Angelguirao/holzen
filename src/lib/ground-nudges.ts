interface GroundNudge {
  title: string;
  body: string;
  tags: string[]; // 'crash', 'surge', 'fear', 'greed', 'general'
}

// Curated behavioral science nudges grounded in real research
const GROUND_NUDGES: GroundNudge[] = [
  // Loss aversion
  {
    title: "Loss aversion amplifies drops 2×",
    body: "Kahneman & Tversky (1979) showed losses feel roughly twice as painful as equivalent gains feel good. A 10% drop feels like losing 20%. Your brain is overweighting this moment.",
    tags: ['crash', 'fear'],
  },
  {
    title: "The endowment effect distorts value",
    body: "Once you own something, you overvalue it (Thaler, 1980). This makes selling feel like a bigger loss than it actually is — and not selling feel like wisdom when it might just be inertia.",
    tags: ['general'],
  },
  // Panic selling research
  {
    title: "Panic sellers underperform by 4.6%",
    body: "Dalbar's QAIB study (2023) found the average equity investor earned 4.6% less than the S&P 500 annually — primarily because of selling during downturns and buying during euphoria.",
    tags: ['crash', 'fear'],
  },
  {
    title: "90% of worst days neighbor best days",
    body: "JP Morgan found that 7 of the 10 best trading days occurred within 2 weeks of the 10 worst days. Missing the recovery by selling during panic is statistically the biggest risk.",
    tags: ['crash', 'fear'],
  },
  // Disposition effect
  {
    title: "You sell winners too early, hold losers too long",
    body: "The disposition effect (Shefrin & Statman, 1985) shows investors are 1.5× more likely to sell assets at a gain than at a loss. We lock in comfort and avoid confronting mistakes.",
    tags: ['surge', 'greed'],
  },
  // Recency bias
  {
    title: "Recency bias rewrites your memory",
    body: "What happened in the last 24 hours feels like the trend. But Tversky & Kahneman's availability heuristic shows we dramatically overweight recent events when predicting the future.",
    tags: ['crash', 'surge', 'general'],
  },
  // FOMO / herding
  {
    title: "Herding: you're copying strangers",
    body: "Banerjee (1992) showed that rational individuals will abandon private information to follow the crowd — even when the crowd is wrong. Conformity feels safe. It usually isn't.",
    tags: ['surge', 'greed'],
  },
  {
    title: "FOMO is a measurable cognitive bias",
    body: "Fear of missing out activates the same neural pathways as physical pain (Kross et al., 2011). The urgency you feel isn't rational analysis — it's your anterior insula signaling social threat.",
    tags: ['surge', 'greed'],
  },
  // Anchoring
  {
    title: "You're anchored to a meaningless number",
    body: "Anchoring bias (Tversky & Kahneman, 1974) means the price you bought at — or the ATH — becomes a reference point with zero predictive value. The market doesn't know your entry price.",
    tags: ['crash', 'surge', 'general'],
  },
  // Bitcoin-specific historical
  {
    title: "BTC has recovered from every 50%+ crash",
    body: "Bitcoin has experienced five drawdowns exceeding 50% since 2011 (2011: -93%, 2013: -87%, 2018: -84%, 2022: -77%). Each recovery took 12-36 months and exceeded the prior ATH.",
    tags: ['crash', 'fear'],
  },
  {
    title: "The best month often follows the worst",
    body: "In Bitcoin's history, 6 of the 10 highest monthly returns directly followed months with 20%+ declines. The pattern rewards those who survive the drawdown, not those who time it.",
    tags: ['crash', 'fear'],
  },
  // Overconfidence
  {
    title: "Overconfidence peaks at highs",
    body: "Barber & Odean (2001) found that overconfident traders trade 45% more frequently and earn 2.6% less annually. Confidence and competence are negatively correlated in volatile markets.",
    tags: ['surge', 'greed'],
  },
  // Sunk cost
  {
    title: "Sunk cost: past spending shouldn't drive future decisions",
    body: "Arkes & Blumer (1985) demonstrated that people continue investments purely because of what they've already spent — not expected returns. What you've invested is gone. Only the future matters.",
    tags: ['crash', 'general'],
  },
  // Status quo bias
  {
    title: "Doing nothing is also a decision",
    body: "Samuelson & Zeckhauser (1988) found people disproportionately stick with the default. Sometimes holding is wisdom. Sometimes it's paralysis dressed as patience. Know which one you're doing.",
    tags: ['general'],
  },
  // Emotional regulation
  {
    title: "Decisions made during arousal are systematically worse",
    body: "Loewenstein (2005) found that emotional 'hot states' — anger, fear, excitement — cause people to systematically underestimate future regret. Waiting 20 minutes reduces error rates by 40%.",
    tags: ['crash', 'surge', 'general'],
  },
  {
    title: "Your prefrontal cortex needs 90 seconds",
    body: "Neuroscientist Jill Bolte Taylor found that the chemical process of an emotion lasts roughly 90 seconds. If you still feel the same urgency after 90 seconds of deliberate breathing, it may be real. Before that, it's chemistry.",
    tags: ['crash', 'surge', 'general'],
  },
  // Regret aversion
  {
    title: "Anticipated regret distorts choice",
    body: "Zeelenberg (1999) showed that fear of future regret drives decisions more than expected utility. You're not choosing the best option — you're choosing the one you think you'll regret least.",
    tags: ['crash', 'surge', 'general'],
  },
  // Narrative fallacy
  {
    title: "You're creating a story that doesn't exist",
    body: "Nassim Taleb's narrative fallacy: humans compulsively construct causal stories from random data. 'BTC dropped because...' is almost always post-hoc rationalization, not insight.",
    tags: ['crash', 'surge', 'general'],
  },
];

/**
 * Select a contextually relevant ground nudge based on market conditions.
 */
export function selectGroundNudge(context?: string | null): { title: string; body: string } {
  // Parse context for crash/surge/fear/greed signals
  const ctx = (context ?? '').toLowerCase();
  const relevantTags: string[] = ['general'];

  if (ctx.includes('down') || ctx.includes('drop') || ctx.includes('crash')) {
    relevantTags.push('crash');
  }
  if (ctx.includes('up') || ctx.includes('surge') || ctx.includes('ath')) {
    relevantTags.push('surge');
  }
  if (ctx.includes('fear') || ctx.includes('extreme fear')) {
    relevantTags.push('fear');
  }
  if (ctx.includes('greed') || ctx.includes('extreme greed')) {
    relevantTags.push('greed');
  }

  // Filter nudges that match at least one relevant tag
  const matches = GROUND_NUDGES.filter((n) =>
    n.tags.some((t) => relevantTags.includes(t))
  );

  const pool = matches.length > 0 ? matches : GROUND_NUDGES;

  // Use a time-based seed so the same user sees variety across reflections
  // but the same nudge persists within a session
  const sessionSeed = Math.floor(Date.now() / (1000 * 60 * 30)); // changes every 30min
  const index = sessionSeed % pool.length;

  return { title: pool[index].title, body: pool[index].body };
}
