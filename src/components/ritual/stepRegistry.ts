import { Wind, Eye, PenLine, Target, Dumbbell, BarChart3, Scan, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface RitualStepConfig {
  type: string;
  label: string;
  icon: LucideIcon;
  category: 'mindfulness' | 'reflection' | 'journaling' | 'physical' | 'decision';
  /** Extra config for physical steps */
  action?: string;
  durationMinutes?: number;
}

export const STEP_REGISTRY: Record<string, Omit<RitualStepConfig, 'type'>> = {
  breathe: { label: 'ritual.steps.breathe', icon: Wind, category: 'mindfulness' },
  grounding: { label: 'ritual.steps.grounding', icon: Scan, category: 'mindfulness' },
  checkin: { label: 'ritual.steps.checkin', icon: Heart, category: 'reflection' },
  reflect: { label: 'ritual.steps.reflect', icon: Eye, category: 'reflection' },
  review: { label: 'ritual.steps.review', icon: BarChart3, category: 'reflection' },
  journal: { label: 'ritual.steps.journal', icon: PenLine, category: 'journaling' },
  physical: { label: 'ritual.steps.physical', icon: Dumbbell, category: 'physical' },
  decide: { label: 'ritual.steps.decide', icon: Target, category: 'decision' },
};

export const STEP_CATEGORIES = [
  { id: 'mindfulness', labelKey: 'ritual.categories.mindfulness' },
  { id: 'reflection', labelKey: 'ritual.categories.reflection' },
  { id: 'journaling', labelKey: 'ritual.categories.journaling' },
  { id: 'physical', labelKey: 'ritual.categories.physical' },
  { id: 'decision', labelKey: 'ritual.categories.decision' },
] as const;

/** Default preset templates */
export const PRESET_TEMPLATES = [
  {
    id: 'quick',
    nameKey: 'ritual.presets.quick',
    descKey: 'ritual.presets.quickDesc',
    steps: [{ type: 'breathe' }, { type: 'decide' }],
  },
  {
    id: 'standard',
    nameKey: 'ritual.presets.standard',
    descKey: 'ritual.presets.standardDesc',
    steps: [{ type: 'breathe' }, { type: 'reflect' }, { type: 'journal' }, { type: 'decide' }],
  },
  {
    id: 'deep',
    nameKey: 'ritual.presets.deep',
    descKey: 'ritual.presets.deepDesc',
    steps: [{ type: 'breathe' }, { type: 'review' }, { type: 'reflect' }, { type: 'journal' }, { type: 'decide' }],
  },
  {
    id: 'body',
    nameKey: 'ritual.presets.body',
    descKey: 'ritual.presets.bodyDesc',
    steps: [{ type: 'grounding' }, { type: 'physical', action: 'Go for a walk', durationMinutes: 10 }, { type: 'checkin' }, { type: 'decide' }],
  },
] as const;

export type StepData = {
  type: string;
  action?: string;
  durationMinutes?: number;
};
