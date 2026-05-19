/** Brief four-step macro ritual (Feel → Breath → Integrate → Decide). */
export type BriefPauseStep = 'feel' | 'breath' | 'integrate' | 'decide';

/** Shipped pause ritual depth (brief vs deep). */
export type RitualDepth = 'deep' | 'brief';

/** Bump when persisted step model changes (v4: brief vs deep ritual). */
export const PAUSE_RITUAL_SCHEMA_VERSION = 4 as const;
