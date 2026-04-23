/**
 * Pause V2 badge set — 4 families / 14 active badges.
 *
 * Implements the "Recommended target model (skills-aligned badges)"
 * from `docs/systems/badges-system.md`:
 *
 *   Foundation (3, non-Pro) -> habit start + consistency
 *   Core skills (5 ladders x 3 tiers = 15, non-Pro) -> one ladder per
 *     skill; only the current tier renders, earned tiers collapse into
 *     a compact strip.
 *   Mastery (3, Pro) -> high-volatility proof + long horizon
 *   Legacy / Special (3, non-Pro) -> selected calendar dates
 *
 * 14 is the "active at any moment" count. There are more definitions
 * than that because Core ladders hold three tiers each — but only one
 * tier per ladder renders at a time.
 */

import {
  Flame,
  Wind,
  Shield,
  Target,
  Sparkles,
  BookOpen,
  Award,
  Feather,
  Calendar,
  Mountain,
  type LucideIcon,
} from 'lucide-react';

export type BadgeFamily = 'foundation' | 'core_skill' | 'mastery' | 'legacy';
export type CoreSkill =
  | 'regulation'
  | 'tolerance'
  | 'alignment'
  | 'reappraisal'
  | 'awareness';

export interface BadgeDefinition {
  id: string;
  family: BadgeFamily;
  labelKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
  proOnly: boolean;
  /** For core-skill ladders: the skill this ladder belongs to. */
  coreSkill?: CoreSkill;
  /** Ladder position (1 = bronze-tier, 3 = master-tier). Foundation + Legacy = 0. */
  tier?: number;
  /** Requirement value (count or threshold) — evaluated in compute.ts. */
  requirement: number;
  /** Unit for the progress display. */
  unitKey: string;
}

// -------------------- Foundation (3, non-Pro) --------------------

const FOUNDATION: BadgeDefinition[] = [
  {
    id: 'first-pause',
    family: 'foundation',
    labelKey: 'badges.firstPause',
    descKey: 'badges.firstPauseDesc',
    icon: Flame,
    color: 'hsl(35, 70%, 55%)',
    proOnly: false,
    tier: 0,
    requirement: 1,
    unitKey: 'badges.units.pauses',
  },
  {
    id: 'first-week',
    family: 'foundation',
    labelKey: 'badges.firstWeek',
    descKey: 'badges.firstWeekDesc',
    icon: Calendar,
    color: 'hsl(200, 60%, 55%)',
    proOnly: false,
    tier: 0,
    requirement: 3,
    unitKey: 'badges.units.daysInRollingWeek',
  },
  {
    id: 'first-ritual',
    family: 'foundation',
    labelKey: 'badges.firstRitual',
    descKey: 'badges.firstRitualDesc',
    icon: Sparkles,
    color: 'hsl(280, 55%, 55%)',
    proOnly: false,
    tier: 0,
    requirement: 1,
    unitKey: 'badges.units.pauses',
  },
];

// -------------------- Core skill ladders (5 × 3 = 15, non-Pro) --------------------

function ladder(
  coreSkill: CoreSkill,
  icon: LucideIcon,
  color: string,
  tiers: [number, number, number],
  keyBase: string,
  unitKey: string,
): BadgeDefinition[] {
  return tiers.map((req, i) => ({
    id: `${coreSkill}-${req}`,
    family: 'core_skill' as const,
    labelKey: `badges.${keyBase}${req}`,
    descKey: `badges.${keyBase}${req}Desc`,
    icon,
    color,
    proOnly: false,
    coreSkill,
    tier: i + 1,
    requirement: req,
    unitKey,
  }));
}

const CORE_SKILLS: BadgeDefinition[] = [
  ...ladder(
    'regulation',
    Flame,
    'hsl(200, 55%, 50%)',
    [10, 25, 50],
    'regulation',
    'badges.units.reactiveToComposed',
  ),
  ...ladder(
    'tolerance',
    Shield,
    'hsl(150, 45%, 45%)',
    [5, 15, 40],
    'tolerance',
    'badges.units.highVolHolds',
  ),
  ...ladder(
    'alignment',
    Target,
    'hsl(40, 65%, 50%)',
    [5, 15, 40],
    'alignment',
    'badges.units.aligned',
  ),
  ...ladder(
    'reappraisal',
    BookOpen,
    'hsl(280, 50%, 50%)',
    [10, 25, 50],
    'reappraisal',
    'badges.units.companions',
  ),
  ...ladder(
    'awareness',
    Feather,
    'hsl(340, 55%, 55%)',
    [10, 25, 50],
    'awareness',
    'badges.units.depthPauses',
  ),
];

// -------------------- Mastery (3, Pro) --------------------

const MASTERY: BadgeDefinition[] = [
  {
    id: 'iron-hands',
    family: 'mastery',
    labelKey: 'badges.ironHands',
    descKey: 'badges.ironHandsDesc',
    icon: Mountain,
    color: 'hsl(210, 60%, 40%)',
    proOnly: true,
    requirement: 80, // 80% hold rate over trailing 20 completed pauses (severity >= moderate)
    unitKey: 'badges.units.holdRatePct',
  },
  {
    id: 'thirty-strong',
    family: 'mastery',
    labelKey: 'badges.thirtyStrong',
    descKey: 'badges.thirtyStrongDesc',
    icon: Wind,
    color: 'hsl(170, 50%, 45%)',
    proOnly: true,
    requirement: 30, // 30-day activity streak
    unitKey: 'badges.units.days',
  },
  {
    id: 'full-ritual-100',
    family: 'mastery',
    labelKey: 'badges.fullRitual100',
    descKey: 'badges.fullRitual100Desc',
    icon: Award,
    color: 'hsl(310, 50%, 50%)',
    proOnly: true,
    requirement: 100, // 100 completed pauses with counted companion
    unitKey: 'badges.units.pauses',
  },
];

// -------------------- Legacy / Special (3, non-Pro) --------------------

const LEGACY: BadgeDefinition[] = [
  {
    id: 'btc-genesis',
    family: 'legacy',
    labelKey: 'badges.genesis',
    descKey: 'badges.genesisDesc',
    icon: Calendar,
    color: 'hsl(35, 65%, 55%)',
    proOnly: false,
    requirement: 1,
    unitKey: 'badges.units.event',
  },
  {
    id: 'btc-pizza',
    family: 'legacy',
    labelKey: 'badges.pizza',
    descKey: 'badges.pizzaDesc',
    icon: Calendar,
    color: 'hsl(40, 75%, 55%)',
    proOnly: false,
    requirement: 1,
    unitKey: 'badges.units.event',
  },
  {
    id: 'btc-halving',
    family: 'legacy',
    labelKey: 'badges.halving',
    descKey: 'badges.halvingDesc',
    icon: Calendar,
    color: 'hsl(15, 80%, 50%)',
    proOnly: false,
    requirement: 1,
    unitKey: 'badges.units.event',
  },
];

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  ...FOUNDATION,
  ...CORE_SKILLS,
  ...MASTERY,
  ...LEGACY,
];

/** Helpers consumed by the panel to render ladder-collapsing. */
export function coreSkillLadders(): Record<CoreSkill, BadgeDefinition[]> {
  const out: Record<CoreSkill, BadgeDefinition[]> = {
    regulation: [],
    tolerance: [],
    alignment: [],
    reappraisal: [],
    awareness: [],
  };
  for (const b of BADGE_DEFINITIONS) {
    if (b.family === 'core_skill' && b.coreSkill) {
      out[b.coreSkill].push(b);
    }
  }
  for (const key of Object.keys(out) as CoreSkill[]) {
    out[key].sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0));
  }
  return out;
}

export const CORE_SKILL_KEYS: CoreSkill[] = [
  'regulation',
  'tolerance',
  'alignment',
  'reappraisal',
  'awareness',
];

/** Calendar-day checkers for the Legacy family. */
export const LEGACY_CALENDAR: Record<string, { month: number; day: number }> = {
  'btc-genesis': { month: 0, day: 3 },
  'btc-pizza': { month: 4, day: 22 },
};

export const HALVING_DATES = [
  '2012-11-28',
  '2016-07-09',
  '2020-05-11',
  '2024-04-20',
  '2028-04-15',
  '2032-04-15',
];
