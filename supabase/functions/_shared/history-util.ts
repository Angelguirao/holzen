/**
 * Pure helpers for the History generator.
 *
 * Split out from `generators/history.ts` so they can be unit-tested without
 * Deno / Supabase imports. The main generator imports `HISTORICAL_ERAS`,
 * `pickEra`, and `eraRecentlySeenByKeywords` from here.
 *
 * Keyword-anchored dedup:
 * The previous implementation compared the descriptive era text (e.g.
 * "COVID and institutional era (2020-2021)") against past card titles
 * (e.g. "March 2020 Crash Recovery") via substring match, which almost
 * never fired. Each era now declares a `keywords` array of short
 * distinctive anchors; `eraRecentlySeenByKeywords` considers an era
 * recently-seen if ANY keyword is a substring of ANY recent card title.
 */

export interface HistoricalEra {
  era: string;
  examples: string;
  /** `recovery` = good for anxious/fearful users. `caution` = good for excited/greedy users. `neutral` = anyone. */
  mood: "recovery" | "caution" | "neutral";
  /**
   * Distinctive lower-case anchors found in card titles that came from this era.
   * Substring-matched against lower-cased recent titles for dedup.
   */
  keywords: string[];
}

export const HISTORICAL_ERAS: HistoricalEra[] = [
  // ── Recovery stories (10) — crashes that ended, best for anxious/fearful users ──
  {
    era: "COVID crash and recovery (March 2020)",
    examples: "March 2020 40% single-day crash recovered in 40 days; institutional adoption wave, MicroStrategy treasury buy, $69k peak",
    mood: "recovery",
    keywords: ["covid", "march 2020", "pandemic crash"],
  },
  {
    era: "2018-2019 bear market bottom",
    examples: "Bitcoin's descent from $20k to $3.2k by December 2018, the 18-month accumulation base, recovery to $13k by mid-2019",
    mood: "recovery",
    keywords: ["2018 bear", "2019 bottom", "december 2018", "$3.2k"],
  },
  {
    era: "Mt. Gox collapse and aftermath (2014-2015)",
    examples: "Mt. Gox's February 2014 insolvency, 850,000 BTC lost, two-year bear market, protocol survival and eventual recovery",
    mood: "recovery",
    keywords: ["mt. gox", "mtgox", "2014 bear", "2015 bear"],
  },
  {
    era: "FTX collapse and 2023 recovery",
    examples: "November 2022 FTX insolvency, contagion from Luna/Terra, BTC bottoming near $16k, steady climb through 2023",
    mood: "recovery",
    keywords: ["ftx", "sam bankman", "november 2022", "sbf"],
  },
  {
    era: "Early Bitcoin volatility (2011-2013)",
    examples: "Bitcoin's June 2011 crash from $32 to $2, the 2013 China ban and recovery to $1,000+",
    mood: "recovery",
    keywords: ["2011 bitcoin", "2013 china", "early bitcoin", "$32 to $2"],
  },
  {
    era: "May 2021 China mining ban",
    examples: "China's May 2021 mining crackdown, 50% BTC hashrate offline, miner migration to Texas/Kazakhstan, price recovery by October",
    mood: "recovery",
    keywords: ["china mining ban", "may 2021", "miner migration", "hashrate"],
  },
  {
    era: "Nasdaq dot-com recovery (2002-2007)",
    examples: "Nasdaq bottomed October 2002 at 1,114 (78% drawdown), took 15 years to reclaim its 2000 high but survivors like Amazon thrived",
    mood: "recovery",
    keywords: ["nasdaq recovery", "dot-com recovery", "2002 bottom", "nasdaq 2002"],
  },
  {
    era: "S&P 500 post-2008 recovery",
    examples: "March 2009 S&P low of 676, 55% drawdown from 2007 peak, full recovery by 2013 and decade-long bull run",
    mood: "recovery",
    keywords: ["2008 crisis", "post-2008", "s&p recovery", "march 2009"],
  },
  {
    era: "Amazon's 95% crash and trillion-dollar rise",
    examples: "Amazon fell from $113 in 1999 to $5.51 by October 2001, a 95% drawdown, eventual trillion-dollar market cap two decades later",
    mood: "recovery",
    keywords: ["amazon crash", "amazon 1999", "amazon 2001", "bezos"],
  },
  {
    era: "Apple's 1997 near-bankruptcy and iPhone era",
    examples: "Apple stock below $1 split-adjusted in 1997, Microsoft $150M lifeline, iMac/iPod/iPhone transformation to most valuable company",
    mood: "recovery",
    keywords: ["apple 1997", "iphone", "steve jobs return", "imac"],
  },

  // ── Cautionary tales (7) — euphoria before pain, best for excited/greedy users ──
  {
    era: "2017 Bitcoin mania and 2018 bear",
    examples: "Bitcoin's December 2017 run to $19,783 on retail FOMO, the 84% drawdown through 2018, ICO rubble",
    mood: "caution",
    keywords: ["2017 mania", "december 2017", "2018 bear", "$20k peak"],
  },
  {
    era: "2021 top and 2022 bear market",
    examples: "November 2021 $69k peak, Luna/Terra $40B implosion May 2022, 3AC and Celsius bankruptcies, bottom near $16k",
    mood: "caution",
    keywords: ["november 2021", "$69k", "luna", "terra", "3ac", "celsius"],
  },
  {
    era: "Dot-com bubble (1999-2000)",
    examples: "Nasdaq's 5,048 peak March 2000, Pets.com sock puppet, 78% subsequent drawdown, survivors vs zombies",
    mood: "caution",
    keywords: ["dot-com", "1999 tech", "pets.com", "nasdaq 2000", "dotcom"],
  },
  {
    era: "Black Monday (October 19, 1987)",
    examples: "Dow fell 22.6% in a single session, portfolio insurance cascade, recovery by 1989",
    mood: "caution",
    keywords: ["black monday", "1987 crash", "october 1987"],
  },
  {
    era: "Japan asset price bubble (1989)",
    examples: "Nikkei 225 peak at 38,957 in December 1989, land value of Tokyo's Imperial Palace exceeding California, 30-year round trip",
    mood: "caution",
    keywords: ["japan bubble", "nikkei 1989", "japanese asset", "imperial palace"],
  },
  {
    era: "Gold's 1980 peak and 20-year decline",
    examples: "Gold's $850 peak January 1980 on Hunt brothers silver play and inflation fear, 20-year bear to $250 by 1999",
    mood: "caution",
    keywords: ["gold 1980", "gold peak", "$850 gold", "hunt brothers"],
  },
  {
    era: "US housing bubble (2006-2008)",
    examples: "Case-Shiller peak mid-2006, subprime mortgage collapse, Lehman Brothers September 2008, 27% national home price decline",
    mood: "caution",
    keywords: ["housing bubble", "subprime", "lehman", "case-shiller", "2008 housing"],
  },

  // ── Neutral (5) — long-cycle context for calm/unknown mood ──
  {
    era: "Bitcoin halving cycles",
    examples: "2012, 2016, 2020, 2024 halvings, block reward from 50 to 3.125 BTC, multi-year price patterns",
    mood: "neutral",
    keywords: ["halving", "halvening", "block reward"],
  },
  {
    era: "1970s oil price shocks",
    examples: "1973 OPEC embargo quadrupled oil prices, 1979 Iranian revolution doubled them again, stagflation decade",
    mood: "neutral",
    keywords: ["oil shock", "opec", "1973 oil", "1979 oil", "stagflation"],
  },
  {
    era: "Swiss franc unpegging (January 15, 2015)",
    examples: "Swiss National Bank's surprise removal of €1.20 floor, franc surged 30% in minutes, retail FX broker failures",
    mood: "neutral",
    keywords: ["swiss franc", "snb", "chf peg", "january 2015"],
  },
  {
    era: "Asian financial crisis (1997)",
    examples: "Thai baht devaluation July 1997, contagion through Indonesia/Korea/Malaysia, IMF interventions, 2-year recovery",
    mood: "neutral",
    keywords: ["asian crisis", "thai baht", "1997 asia", "imf"],
  },
  {
    era: "Emerging market FX crises",
    examples: "Turkish lira's 2018-2023 decline, Argentine peso devaluations, Venezuelan hyperinflation, capital flight patterns",
    mood: "neutral",
    keywords: ["turkish lira", "argentine peso", "venezuelan", "hyperinflation"],
  },
];

/**
 * An era is considered "recently seen" if any of its keywords is a substring
 * of any recent card title (all lower-cased).
 *
 * This replaces the old era-text substring check, which almost never fired
 * because era descriptors and card titles rarely share substrings.
 */
export function eraRecentlySeenByKeywords(era: HistoricalEra, recentTitlesLower: string[]): boolean {
  if (!recentTitlesLower || recentTitlesLower.length === 0) return false;
  return era.keywords.some(kw => {
    const k = kw.toLowerCase();
    return recentTitlesLower.some(t => t.includes(k));
  });
}

function filterByMood(
  eras: HistoricalEra[],
  mood: string | undefined,
  preferredMood?: "recovery" | "caution" | "neutral",
): HistoricalEra[] {
  if (preferredMood) {
    const m = eras.filter(e => e.mood === preferredMood);
    return m.length > 0 ? m : eras;
  }
  if (mood === "anxious" || mood === "fearful") {
    return eras.filter(e => e.mood === "recovery");
  }
  if (mood === "excited" || mood === "fomo" || mood === "greedy") {
    return eras.filter(e => e.mood === "caution");
  }
  return eras;
}

/**
 * Select a historical era using three-step fallback:
 *   1. Mood-preferred AND not recently seen
 *   2. ANY era not recently seen (soften the mood filter before forcing a repeat)
 *   3. Full pool (user has seen everything recently — pick at random)
 *
 * Inject `rand` for deterministic tests.
 */
export function pickEra(
  mood: string | undefined,
  recentTitles: string[] | undefined,
  preferredMood?: "recovery" | "caution" | "neutral",
  rand: () => number = Math.random,
  eras: HistoricalEra[] = HISTORICAL_ERAS,
): HistoricalEra {
  const recentLower = (recentTitles || []).map(t => t.toLowerCase());
  const preferred = filterByMood(eras, mood, preferredMood);

  const preferredFresh = preferred.filter(e => !eraRecentlySeenByKeywords(e, recentLower));
  if (preferredFresh.length > 0) {
    return preferredFresh[Math.floor(rand() * preferredFresh.length)];
  }

  const anyFresh = eras.filter(e => !eraRecentlySeenByKeywords(e, recentLower));
  if (anyFresh.length > 0) {
    return anyFresh[Math.floor(rand() * anyFresh.length)];
  }

  return eras[Math.floor(rand() * eras.length)];
}
