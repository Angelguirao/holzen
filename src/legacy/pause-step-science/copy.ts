import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';

/** English copy previously under `pauseScience.*` in `src/locales/en.json`. */
export const PAUSE_STEP_SCIENCE_COPY = {
  title: 'Each step follows research',
  steps: {
    feel: { label: 'Feel', desc: "Labeling emotions ('affect labeling') reduces amygdala activation — but naming comes early so the rest of the ritual can work with what you named. (Lieberman et al., 2007)" },
    breathe: { label: 'Breathe', desc: 'Slow breathing activates the parasympathetic nervous system, shifting from fight-or-flight to regulation before deeper reflection. (Porges, 2011)' },
    reflect: { label: 'Reflect', desc: 'Cognitive reappraisal after regulation leads to better decisions than suppression. (Gross, 2002)' },
    frame: { label: 'Frame', desc: 'Step back into tools and companions — metacognitive choice about where to look next before you decide. (Flavell, 1979)' },
    breath2: { label: 'Breathe again', desc: 'A second regulation pass after reframing lowers arousal again before commitment. (Lehrer & Gevirtz, 2014)' },
    decide: { label: 'Decide', desc: 'System 2 is now online. You can act from intention, not impulse. (Kahneman, 2011)' },
  } satisfies Record<PauseStep, { label: string; desc: string }>,
} as const;
