import type { LucideIcon } from 'lucide-react';
import { Wind, Leaf, Mail, Waves, PenLine, Activity, RotateCcw } from 'lucide-react';
import { TOOLS } from '@/lib/app-routes';
export type ToolCatalogId =
  | 'letters'
  | 'breathe'
  | 'ground'
  | 'checkin'
  | 'journal'
  | 'bodyscan'
  | 'replay';

export type ToolCatalogEntry = {
  id: ToolCatalogId;
  to: string;
  /** i18n key for the main title (often shared with Tools / Practice copy). */
  labelKey: string;
  /** Optional shorter tile title for the 2×2 hub grid (wireframe naming). */
  hubTitleKey?: string;
  /** Short marketing blurb for hub cards (two sentences max in copy). */
  blurbKey: string;
  icon: LucideIcon;
  /** If false, Pro subscription required (same rules as previous Tools hub). */
  free: boolean;
  /** Passed to upgrade toast when `free` is false. */
  proFeature?: ProFeature | string;
};

/** Wireframe “Or pick what you need” — four primary tiles. */
export const TOOLS_HUB_SPOTLIGHT_ORDER: readonly ToolCatalogId[] = [
  'ground',
  'letters',
  'breathe',
  'replay',
] as const;

export const TOOLS_HUB_MORE_ORDER: readonly ToolCatalogId[] = ['checkin', 'journal', 'bodyscan'] as const;

const ENTRIES: Record<ToolCatalogId, ToolCatalogEntry> = {
  letters: {
    id: 'letters',
    to: TOOLS.letters,
    labelKey: 'tools.letters',
    hubTitleKey: 'tools.hub.tile.capsule',
    blurbKey: 'tools.hub.blurb.letters',
    icon: Mail,
    free: false,
    proFeature: 'letters',
  },
  breathe: {
    id: 'breathe',
    to: TOOLS.breathe,
    labelKey: 'tools.breathe',
    blurbKey: 'tools.hub.blurb.breathe',
    icon: Wind,
    free: true,
  },
  ground: {
    id: 'ground',
    to: TOOLS.ground,
    labelKey: 'tools.ground',
    hubTitleKey: 'tools.hub.tile.grounding',
    blurbKey: 'tools.hub.blurb.ground',
    icon: Leaf,
    free: false,
    proFeature: 'grounding',
  },
  checkin: {
    id: 'checkin',
    to: TOOLS.practice.checkin,
    labelKey: 'practice.checkinLabel',
    blurbKey: 'tools.hub.blurb.checkin',
    icon: Waves,
    free: true,
  },
  journal: {
    id: 'journal',
    to: TOOLS.practice.journal,
    labelKey: 'practice.journalLabel',
    blurbKey: 'tools.hub.blurb.journal',
    icon: PenLine,
    free: false,
    proFeature: 'journal',
  },
  bodyscan: {
    id: 'bodyscan',
    to: TOOLS.practice.bodyscan,
    labelKey: 'practice.bodyscanLabel',
    blurbKey: 'tools.hub.blurb.bodyscan',
    icon: Activity,
    free: false,
    proFeature: 'bodyscan',
  },
  replay: {
    id: 'replay',
    to: TOOLS.practice.replay,
    labelKey: 'practice.replayLabel',
    blurbKey: 'tools.hub.blurb.replay',
    icon: RotateCcw,
    free: false,
    proFeature: 'replay',
  },
};

export function getToolCatalogEntry(id: ToolCatalogId): ToolCatalogEntry {
  return ENTRIES[id];
}

export function spotlightToolEntries(): ToolCatalogEntry[] {
  return TOOLS_HUB_SPOTLIGHT_ORDER.map((id) => ENTRIES[id]);
}

export function moreToolEntries(): ToolCatalogEntry[] {
  return TOOLS_HUB_MORE_ORDER.map((id) => ENTRIES[id]);
}
