/** 1–5 labels shared by Feel step and brief Done intensity row (Figma wireframe). */
export const PAUSE_FEEL_INTENSITY_KEYS = ['faint', 'light', 'clear', 'strong', 'heavy'] as const;

export type PauseFeelIntensityKey = (typeof PAUSE_FEEL_INTENSITY_KEYS)[number];
