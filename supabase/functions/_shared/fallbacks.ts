/**
 * Shared curated fallback content pools for all companion types.
 * Centralised to prevent divergence and duplication across functions.
 *
 * These are hand-written, verified, high-quality entries used as the
 * last resort when both live generation and cache fail.
 */

// ── Signal (philosophical Bitcoin insights) ──
export const SIGNAL_FALLBACKS = [
  {
    title: "Proof of work is proof of sacrifice",
    body: "Gigi argues that Bitcoin's proof-of-work mechanism mirrors a universal truth: nothing of value comes without cost. The energy expended isn't wasted — it's transformed into trust, the most scarce resource in human coordination.",
    source: "Gigi — 21 Lessons",
    url: "https://21lessons.com/",
  },
  {
    title: "Sound money teaches patience before it teaches wealth",
    body: "Saifedean Ammous observes that the hardest lesson Bitcoin teaches isn't about returns — it's about time preference. A society that saves in hard money naturally extends its planning horizon, building cathedrals instead of strip malls.",
    source: "Saifedean Ammous — The Bitcoin Standard",
    url: "https://saifedean.com/thebitcoinstandard/",
  },
  {
    title: "Sovereignty begins with what you refuse to delegate",
    body: "Parker Lewis writes that holding your own keys isn't a technical preference — it's a philosophical stance. Every system that asks you to trust a third party is a system that can betray you. Self-custody is the first act of self-sovereignty.",
    source: "Parker Lewis — Gradually, Then Suddenly",
    url: "https://unchained.com/gradually-then-suddenly/",
  },
  {
    title: "The price is the least interesting thing about Bitcoin",
    body: "Allen Farrington argues that fixating on price is like judging the printing press by the cost of paper. Bitcoin's real innovation is the separation of money and state — a shift as consequential as the separation of church and state.",
    source: "Allen Farrington — Bitcoin Is Venice",
    url: "https://allenfarrington.medium.com/",
  },
  {
    title: "Volatility is the price of admission to a new monetary order",
    body: "Vijay Boyapati observes that every new monetary good must pass through a period of extreme volatility on its path to stable purchasing power. Gold was volatile for centuries. Bitcoin is compressing that journey into decades.",
    source: "Vijay Boyapati — The Bullish Case for Bitcoin",
    url: "https://vijayboyapati.medium.com/the-bullish-case-for-bitcoin-6ecc8bdecc1",
  },
];

// ── Grounding (behavioral finance research) ──
export const GROUNDING_FALLBACKS = [
  {
    title: "Loss aversion doubles the sting of dropping prices",
    body: "Kahneman and Tversky's 1979 prospect theory study showed that losses feel roughly twice as painful as equivalent gains feel good. When BTC drops 5%, your brain processes it as if you lost 10%. This asymmetry is hardwired — recognizing it is the first step to not acting on it.",
    citation: "Kahneman & Tversky (1979), Prospect Theory: An Analysis of Decision under Risk",
    url: "https://scholar.google.com/scholar?q=kahneman+tversky+prospect+theory+1979",
  },
  {
    title: "The disposition effect: why we sell winners and hold losers",
    body: "Shefrin and Statman's 1985 study found that investors are 50% more likely to sell a winning position than a losing one. We lock in gains too early out of fear, and hold losses too long out of hope. The pattern repeats across every asset class — including Bitcoin.",
    citation: "Shefrin & Statman (1985), The Disposition to Sell Winners Too Early and Ride Losers Too Long",
    url: "https://scholar.google.com/scholar?q=shefrin+statman+disposition+effect+1985",
  },
  {
    title: "Social proof cascades: when everyone sells, your brain wants to follow",
    body: "Bikhchandani, Hirshleifer, and Welch's 1992 research on information cascades showed that rational individuals can make irrational collective decisions by mimicking others. In crypto markets, this amplifies both panic selling and FOMO buying beyond any fundamental justification.",
    citation: "Bikhchandani, Hirshleifer & Welch (1992), A Theory of Fads, Fashion, Custom, and Cultural Change as Informational Cascades",
    url: "https://scholar.google.com/scholar?q=bikhchandani+hirshleifer+welch+informational+cascades+1992",
  },
  {
    title: "Your prefrontal cortex goes offline during financial stress",
    body: "Lo and Repin's 2002 study using real-time physiological monitoring of traders found that market volatility triggers measurable autonomic nervous system responses — elevated heart rate, skin conductance changes — that impair the prefrontal cortex's capacity for rational decision-making.",
    citation: "Lo & Repin (2002), The Psychophysiology of Real-Time Financial Risk Processing",
    url: "https://scholar.google.com/scholar?q=lo+repin+psychophysiology+financial+risk+2002",
  },
  {
    title: "Recency bias: your brain over-weights the last 48 hours",
    body: "Tversky and Kahneman's availability heuristic research demonstrated that people judge probability based on how easily examples come to mind. A sharp BTC drop yesterday looms larger than years of steady gains. Your memory is not a balanced ledger — it's a highlight reel biased toward the recent.",
    citation: "Tversky & Kahneman (1973), Availability: A Heuristic for Judging Frequency and Probability",
    url: "https://scholar.google.com/scholar?q=tversky+kahneman+availability+heuristic+1973",
  },
];

// ── Historical Insight (cross-asset parallels) ──
export const HISTORY_FALLBACKS = [
  {
    title: "When gold crashed 26% in 2013",
    btcInsight: "Between April 12-15, 2013, gold plummeted from $1,560 to $1,321 per ounce — a 26% crash in three days. Panic sellers locked in generational losses. Those who held saw gold consolidate and stabilize, eventually becoming a cornerstone of central bank reserves again.",
    analogy: "The same pattern preceded every major Bitcoin recovery: sharp fear, forced selling, then quiet accumulation by those who understood what they owned.",
    assetClass: "Gold",
    period: "April 2013",
    source: "Financial Times historical archive",
    url: "https://www.ft.com/",
  },
  {
    title: "Amazon lost 95% and became the everything store",
    btcInsight: "From its December 1999 peak of $106.69, Amazon crashed to $5.51 by October 2001 — a 95% drawdown. The narrative shifted from 'world-changing company' to 'overvalued dot-com.' Anyone who sold at $5.51 missed a stock that would eventually reach $3,000+.",
    analogy: "Bitcoin has experienced five drawdowns of 70%+ in its history. Each time, the 'it's dead' narrative peaked at the bottom.",
    assetClass: "Tech stocks",
    period: "2000-2001",
    source: "Historical stock data",
    url: "https://en.wikipedia.org/wiki/Amazon_(company)#Stock",
  },
  {
    title: "The 2020 COVID crash recovered in 40 days",
    btcInsight: "On March 12, 2020 — 'Black Thursday' — Bitcoin fell from $7,900 to $3,800 in 24 hours, a 52% single-day crash. It was the fastest drawdown in Bitcoin's history. Yet within 40 days, BTC had recovered to pre-crash levels, and within 9 months it set a new all-time high.",
    analogy: "The S&P 500 followed a similar pattern, crashing 34% and fully recovering by August 2020. The lesson: the speed of the crash rarely predicts the timeline of recovery.",
    assetClass: "S&P 500",
    period: "March 2020",
    source: "CoinDesk historical data",
    url: "https://www.coindesk.com/",
  },
  {
    title: "The Swiss franc shock of 2015",
    btcInsight: "On January 15, 2015, the Swiss National Bank unexpectedly removed the EUR/CHF floor. The franc surged 30% in minutes, wiping out over-exposed traders and bankrupting multiple brokerages. It was the largest single-day move in a major currency in modern history.",
    analogy: "Like Bitcoin's sudden moves, the Swiss franc shock demonstrated that markets can reprice decades of assumptions in minutes. Those with no borrowed exposure and long time horizons were unscathed.",
    assetClass: "Forex",
    period: "January 2015",
    source: "Bloomberg historical archive",
    url: "https://www.bloomberg.com/",
  },
  {
    title: "Bitcoin's 2018 winter lasted 12 months",
    btcInsight: "After reaching $19,783 in December 2017, Bitcoin entered a 12-month bear market that bottomed at $3,122 in December 2018 — an 84% drawdown. Most altcoins lost 95%+. The narrative shifted entirely from 'new paradigm' to 'dead technology.'",
    analogy: "The dot-com bust of 2000 saw the NASDAQ lose 78% over 30 months. Both events cleared speculative excess while the underlying technology continued developing.",
    assetClass: "NASDAQ",
    period: "December 2017 – December 2018",
    source: "CoinMarketCap historical data",
    url: "https://coinmarketcap.com/currencies/bitcoin/",
  },
];

// ── Zoom Out (deep-time perspective) ──
export const ZOOM_OUT_FALLBACKS = [
  {
    title: "Fifteen years in five thousand",
    body: "Humans have used money for roughly 5,000 years — shells, salt, gold, paper, digits. Bitcoin is 15 years old. You're watching the first chapter of a new monetary epoch being written in real time.",
  },
  {
    title: "The patience of geology",
    body: "The Grand Canyon took 6 million years to carve. Today's price movement is a single grain of sand in that process. The forces shaping Bitcoin — cryptography, energy, mathematics — operate on timescales your portfolio screen cannot display.",
  },
  {
    title: "Gold took centuries to become gold",
    body: "For thousands of years, humans carried gold without knowing why it was valuable beyond its beauty. It took until 1717 for Isaac Newton to formally establish the gold standard. Monetary consensus is measured in centuries, not quarters.",
  },
  {
    title: "A technology adopted in the blink of history",
    body: "The printing press took 50 years to spread across Europe. The internet took 30 years to connect the world. Bitcoin has connected 200 million people in 15 years. You're living through the fastest monetary adoption in human history.",
  },
  {
    title: "The sun sends more energy in one hour",
    body: "The sun delivers more energy to Earth in a single hour than humanity uses in an entire year. Bitcoin's energy usage, often criticized, represents a rounding error against the cosmic backdrop. Perspective is a function of the frame you choose.",
  },
];

// ── Reflection (curated fallback reflections for holzen-reflect) ──
export const REFLECTION_FALLBACKS = [
  {
    message: "The number changed. You didn't. That distinction is worth sitting with.",
    haiku: "Digits on a screen\nshift like sand beneath the tide\nthe shore remains still",
  },
  {
    message: "Between the price alert and your next action, there is a space. That space is yours.",
    haiku: "A bell rings somewhere\nthe hand pauses, breath arrives\nchoice lives in the gap",
  },
  {
    message: "Every holder who came before you sat exactly where you're sitting now, feeling exactly what you feel.",
    haiku: "Footprints in the snow\nthousands walked this path before\nspring remembered them",
  },
  {
    message: "What would the version of you one year from now think about this moment?",
    haiku: "Tomorrow's calm self\nlooks back at today's sharp edge\nand finds it was round",
  },
  {
    message: "Volatility is not the enemy of conviction. It's the price of it.",
    haiku: "The mountain does not\napologize for its storms\nit simply endures",
  },
];

/** Pick a random item from a fallback pool */
export function pickRandom<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}
