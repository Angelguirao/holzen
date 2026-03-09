import { Wind, Eye, PenLine, Target, Dumbbell, BarChart3, Scan, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface RitualStepConfig {
  type: string;
  label: string;
  descKey: string;
  icon: LucideIcon;
  category: 'mindfulness' | 'reflection' | 'journaling' | 'physical' | 'decision';
  /** Extra config for physical steps */
  action?: string;
  durationMinutes?: number;
}

export const STEP_REGISTRY: Record<string, Omit<RitualStepConfig, 'type'>> = {
  breathe: { label: 'ritual.steps.breathe', descKey: 'ritual.steps.breatheDesc', icon: Wind, category: 'mindfulness' },
  grounding: { label: 'ritual.steps.grounding', descKey: 'ritual.steps.groundingDesc', icon: Scan, category: 'mindfulness' },
  checkin: { label: 'ritual.steps.checkin', descKey: 'ritual.steps.checkinDesc', icon: Heart, category: 'reflection' },
  reflect: { label: 'ritual.steps.reflect', descKey: 'ritual.steps.reflectDesc', icon: Eye, category: 'reflection' },
  review: { label: 'ritual.steps.review', descKey: 'ritual.steps.reviewDesc', icon: BarChart3, category: 'reflection' },
  journal: { label: 'ritual.steps.journal', descKey: 'ritual.steps.journalDesc', icon: PenLine, category: 'journaling' },
  physical: { label: 'ritual.steps.physical', descKey: 'ritual.steps.physicalDesc', icon: Dumbbell, category: 'physical' },
  decide: { label: 'ritual.steps.decide', descKey: 'ritual.steps.decideDesc', icon: Target, category: 'decision' },
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
