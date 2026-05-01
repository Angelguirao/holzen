import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeading } from '@/components/PageHeading';
import { TOOLS } from '@/lib/app-routes';
import { Wind, Leaf, History, Waves, PenLine, Activity, RotateCcw, Mail, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useProGate } from '@/hooks/use-pro-gate';
import { cn } from '@/lib/utils';

const TOOL_LINKS: { to: string; labelKey: string; descKey: string; icon: LucideIcon; proHighlight?: boolean }[] = [
  { to: TOOLS.letters, labelKey: 'tools.letters', descKey: 'tools.lettersDesc', icon: Mail, proHighlight: true },
  { to: TOOLS.breathe, labelKey: 'tools.breathe', descKey: 'tools.breatheDesc', icon: Wind },
  { to: TOOLS.ground, labelKey: 'tools.ground', descKey: 'tools.groundDesc', icon: Leaf, proHighlight: true },
  { to: TOOLS.practice.checkin, labelKey: 'practice.checkinLabel', descKey: 'practice.checkinDesc', icon: Waves },
  { to: TOOLS.practice.journal, labelKey: 'practice.journalLabel', descKey: 'practice.journalDesc', icon: PenLine },
  { to: TOOLS.practice.bodyscan, labelKey: 'practice.bodyscanLabel', descKey: 'practice.bodyscanDesc', icon: Activity },
  { to: TOOLS.practice.replay, labelKey: 'practice.replayLabel', descKey: 'practice.replayDesc', icon: RotateCcw },
];

/**
 * In-app index for full-screen tools (regulation, grounding, practice, letters).
 * Individual experiences stay full-screen; this screen uses the main shell and bottom nav.
 */
export default function ToolsHub() {
  const { t } = useTranslation();
  const { isPro, isPending } = useProGate();

  return (
    <div className="space-y-6 pb-8">
      <PageHeading title={t('tools.title')} subtitle={t('tools.subtitle')} />
      <p className="text-xs text-muted-foreground/90 leading-relaxed">{t('tools.listIntro')}</p>
      <ul className="space-y-1.5">
        {TOOL_LINKS.map(({ to, labelKey, descKey, icon: Icon, proHighlight }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex w-full items-start gap-3 rounded-xl border border-border/40 bg-muted/20 px-3 py-3 transition-colors hover:bg-muted/40"
            >
              <Icon className="h-4 w-4 shrink-0 mt-0.5 text-secondary-foreground" />
              <div className="min-w-0 flex-1 text-left">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{t(labelKey)}</span>
                  {proHighlight && !isPending && !isPro && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'h-5 border-amber-500/35 bg-amber-500/10 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200',
                      )}
                    >
                      {t('tools.proShortBadge')}
                    </Badge>
                  )}
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{t(descKey)}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 mt-1" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
