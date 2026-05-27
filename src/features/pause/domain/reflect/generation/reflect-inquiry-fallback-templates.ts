/** Static inquiry fallbacks when LLM or curated pool lacks a dedicated inquiry field. */

const INQUIRY_BY_MOOD_DIRECTION: Record<string, Record<string, string>> = {
  down: {
    fearful: 'What are you afraid will happen if this continues?',
    anxious: 'What feels most at risk for you right now — money, identity, or something else?',
    uncertain: 'What part of this move feels hardest to sit with?',
    calm: 'What story are you telling yourself about why this drop matters?',
    fomo: 'What would you be chasing if you acted on this dip?',
    excited: 'What outcome are you hoping this drop might unlock?',
    greedy: 'What would “winning” from this moment look like to you?',
    detached: 'What would change if you treated this as weather, not verdict?',
    default: 'What feels most true about why this move is hitting you right now?',
  },
  up: {
    fomo: 'What are you afraid of missing if you do nothing?',
    excited: 'What would you regret doing if this keeps running?',
    greedy: 'What story makes this rally feel like proof you were right?',
    anxious: 'What could go wrong if you confuse momentum with safety?',
    fearful: 'What are you protecting by staying out or selling?',
    calm: 'What would staying steady cost you emotionally right now?',
    uncertain: 'What decision feels urgent — and what if it is not?',
    detached: 'What would you notice if you stepped back from the hype?',
    default: 'What story are you telling yourself about why this rise matters?',
  },
  flat: {
    default: 'What is this moment asking you to notice about yourself?',
  },
};

export function marketDirectionFromContext(context: string): 'down' | 'up' | 'flat' {
  const lower = context.toLowerCase();
  if (lower.includes('is down') || lower.includes('down ')) return 'down';
  if (lower.includes('is up') || lower.includes('up ')) return 'up';
  return 'flat';
}

export function reflectInquiryFallbackTemplate(mood: string, context: string): string {
  const direction = marketDirectionFromContext(context);
  const moodKey = mood.toLowerCase();
  const table = INQUIRY_BY_MOOD_DIRECTION[direction] ?? INQUIRY_BY_MOOD_DIRECTION.flat;
  return table[moodKey] ?? table.default ?? INQUIRY_BY_MOOD_DIRECTION.flat.default;
}
