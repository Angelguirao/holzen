import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Award, Flame, Shield, Target, BookOpen, Feather, Sparkles, Calendar, Mountain, Wind, Lock } from 'lucide-react';
import { NoxHeaderMain } from '@/components/ui/nox-header';
import { Button } from '@/components/ui/button';
import {
  BADGE_DEFINITIONS,
  CORE_SKILL_KEYS,
  type CoreSkill,
} from '@/lib/badges/definitions';

/**
 * In-app badge details / guide screen.
 *
 * Explains each badge family and the exact stats/conditions that
 * unlock it. Source of truth mirrors `src/lib/badges/compute.ts`
 * and `src/lib/badges/definitions.ts`.
 */

interface Row {
  id: string;
  title: string;
  unlock: string;
  tier?: string;
  pro?: boolean;
}

interface Section {
  family: 'foundation' | 'core_skill' | 'mastery' | 'legacy';
  title: string;
  intro: string;
  rows: Row[];
  pro?: boolean;
}

const CORE_INTRO: Record<CoreSkill, { title: string; intro: string; unlocks: (req: number) => string }> = {
  regulation: {
    title: 'Regulation',
    intro: 'Move from a reactive mood (anxious, fearful, FOMO, greedy, excited) to a composed one (calm, detached) within a single pause.',
    unlocks: (n) => `Complete ${n} pauses where your initial mood was reactive and your shifted mood was composed.`,
  },
  tolerance: {
    title: 'Tolerance',
    intro: 'Sit through real volatility without acting. Counts pauses during moderate or high-severity BTC moves.',
    unlocks: (n) => `Complete ${n} pauses during moderate or high volatility where you chose Hold or did nothing.`,
  },
  alignment: {
    title: 'Alignment',
    intro: 'Decisions that match your declared hold goal. Requires a hold goal in Settings.',
    unlocks: (n) =>
      `Complete ${n} pauses whose outcome aligns with your hold goal (Held/Nothing under "forever"; Held under time or price goals).`,
  },
  reappraisal: {
    title: 'Reappraisal',
    intro: 'Use a companion (Signal, Zoom Out, History, Grounding) inside a pause to reframe what you are feeling.',
    unlocks: (n) => `Use a counted companion ${n} times across your completed pauses.`,
  },
  awareness: {
    title: 'Awareness',
    intro: 'Pauses with depth — a real note (>20 chars), at least one tag, or marked as a favorite.',
    unlocks: (n) => `Complete ${n} pauses with a meaningful note, a tag, or marked as favorite.`,
  },
};

export default function BadgeGuide() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const foundationRows: Row[] = [
    {
      id: 'first-pause',
      title: 'First pause',
      unlock: 'Complete your very first pause (any state shift, any outcome).',
    },
    {
      id: 'first-week',
      title: 'First week',
      unlock: 'Pause on at least 3 distinct days within any rolling 7-day window.',
    },
    {
      id: 'first-ritual',
      title: 'First ritual',
      unlock: 'Complete a pause where you used at least one companion (Signal, Zoom Out, History, or Grounding). A "ritual" is a pause + companion, not a bare check-in.',
    },
  ];

  const masteryRows: Row[] = [
    {
      id: 'iron-hands',
      title: 'Iron Hands',
      unlock: 'Hold (or do nothing) on at least 80% of your last 20+ pauses during moderate or high BTC volatility.',
      pro: true,
    },
    {
      id: 'thirty-strong',
      title: 'Thirty Strong',
      unlock: 'Maintain a 30-day rolling streak of completed pauses.',
      pro: true,
    },
    {
      id: 'full-ritual-100',
      title: 'Full Ritual ×100',
      unlock: 'Complete 100 pauses that each used a companion (counted ritual pauses).',
      pro: true,
    },
  ];

  const legacyRows: Row[] = [
    {
      id: 'btc-genesis',
      title: 'Genesis',
      unlock: 'Complete a pause on January 3 (local time) — the day the Bitcoin genesis block was mined.',
    },
    {
      id: 'btc-pizza',
      title: 'Pizza Day',
      unlock: 'Complete a pause on May 22 — the anniversary of the 10,000 BTC pizza.',
    },
    {
      id: 'btc-halving',
      title: 'Halving',
      unlock: 'Complete a pause within ±3 days of any Bitcoin halving date.',
    },
  ];

  const coreLadders = CORE_SKILL_KEYS.map((skill) => {
    const tiers = BADGE_DEFINITIONS.filter(
      (b) => b.family === 'core_skill' && b.coreSkill === skill,
    ).sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0));
    return { skill, tiers };
  });

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('common.back', { defaultValue: 'Back' })}
      </button>

      <NoxHeaderMain
        title="How badges work"
        subtitle="Each badge marks a real behavioral pattern — not vanity metrics. Here's exactly what unlocks each one."
      />

      {/* Foundation */}
      <Section
        icon={Flame}
        title="Foundation"
        intro="Three starter badges that mark the formation of a pause habit. None require Pro."
      >
        {foundationRows.map((r) => (
          <BadgeRow key={r.id} title={r.title} unlock={r.unlock} />
        ))}
      </Section>

      {/* Core skills */}
      <Section
        icon={Target}
        title="Core skills"
        intro="Five skill ladders, three tiers each. Only the next tier shows on the panel; earlier tiers collapse into a strip. Tiers are cumulative — your count never resets."
      >
        {coreLadders.map(({ skill, tiers }) => {
          const meta = CORE_INTRO[skill];
          const Icon = SKILL_ICON[skill];
          return (
            <div key={skill} className="rounded-lg border border-border/40 bg-muted/10 px-4 py-3 space-y-3">
              <div className="flex items-start gap-2">
                <Icon className="h-4 w-4 mt-0.5 text-primary shrink-0" aria-hidden />
                <div className="space-y-1">
                  <p className="text-sm font-sans font-medium">{meta.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{meta.intro}</p>
                </div>
              </div>
              <ul className="space-y-1.5 pl-6">
                {tiers.map((b) => (
                  <li key={b.id} className="flex items-baseline gap-2 text-xs">
                    <span className="font-mono uppercase tracking-widest text-[10px] text-[#dbb266] shrink-0">
                      Tier {b.tier}
                    </span>
                    <span className="text-secondary-foreground/90">{meta.unlocks(b.requirement)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </Section>

      {/* Mastery */}
      <Section
        icon={Mountain}
        title="Mastery"
        intro="High-bar achievements that prove you can hold under pressure and over time. Pro-only."
        proBadge
      >
        {masteryRows.map((r) => (
          <BadgeRow key={r.id} title={r.title} unlock={r.unlock} pro />
        ))}
      </Section>

      {/* Legacy */}
      <Section
        icon={Calendar}
        title="Legacy"
        intro="Calendar-day badges tied to Bitcoin history. Earned by pausing on the day, not by buying or selling."
      >
        {legacyRows.map((r) => (
          <BadgeRow key={r.id} title={r.title} unlock={r.unlock} />
        ))}
      </Section>

      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <p className="text-sm font-sans font-medium">A note on counting</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Only <span className="text-foreground">completed</span> pauses count. Abandoned or skipped pauses don't move any counter. Companion-based badges only count companions you actually engaged with inside a pause (counts_for_pause = true).
        </p>
      </div>

      <div className="pt-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/journey/badges')}>
          Back to my badges
        </Button>
      </div>
    </div>
  );
}

const SKILL_ICON: Record<CoreSkill, typeof Flame> = {
  regulation: Flame,
  tolerance: Shield,
  alignment: Target,
  reappraisal: BookOpen,
  awareness: Feather,
};

function Section({
  icon: Icon,
  title,
  intro,
  children,
  proBadge,
}: {
  icon: typeof Flame;
  title: string;
  intro: string;
  children: React.ReactNode;
  proBadge?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#dbb266]" aria-hidden />
          <h2 className="tracking-widest uppercase text-sm font-sans text-[#dbb266]">{title}</h2>
        </div>
        {proBadge && (
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-[#dbb266]">
            <Lock className="h-2.5 w-2.5" aria-hidden /> Pro
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{intro}</p>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function BadgeRow({ title, unlock, pro }: { title: string; unlock: string; pro?: boolean }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/10 px-4 py-3 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-sans font-medium">{title}</p>
        {pro && <Sparkles className="h-3 w-3 text-primary/60" aria-hidden />}
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{unlock}</p>
    </div>
  );
}

// Silence unused-imports noise (icons referenced via SKILL_ICON map only).
void Wind;