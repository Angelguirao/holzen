import { useMemo, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PauseArchiveRow } from '@/lib/pause-archive-list-query';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ArchivePauseRetrospectiveOutcomeSheet } from '@/components/archive/ArchivePauseRetrospectiveOutcomeSheet';
import { pauseArchiveRowAllowsRetrospectiveOutcome } from '@/lib/pause-archive-retrospective-outcome';

function firstPreviewSource(row: PauseArchiveRow): string {
  const parts = [
    row.reflection_text,
    row.haiku_text,
    row.note_text,
    row.outcome,
    row.initial_mood,
  ].filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  return parts[0]?.trim() ?? '';
}

function previewText(row: PauseArchiveRow, maxLen: number): string {
  const t = firstPreviewSource(row);
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

type Props = {
  row: PauseArchiveRow;
  echoesPresentation?: boolean;
  /** After a retrospective outcome is saved, refresh archive rows (and counts). */
  onOutcomeLogged?: () => void | Promise<void>;
};

export function ArchivePauseCard({ row, echoesPresentation = false, onOutcomeLogged }: Props) {
  const { t } = useTranslation();
  const id = row.id;
  const collapsibleId = useId();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [outcomeSheetOpen, setOutcomeSheetOpen] = useState(false);
  const showRetrospectiveCta = pauseArchiveRowAllowsRetrospectiveOutcome(row);
  const when = row.terminal_at ?? row.created_at;
  const timeAgo = useMemo(() => {
    if (!when) return '';
    try {
      return formatDistanceToNow(new Date(when), { addSuffix: true });
    } catch {
      return '';
    }
  }, [when]);

  const preview = useMemo(() => previewText(row, 280), [row]);
  const previewExpanded = useMemo(() => previewText(row, 4000), [row]);
  const companionTypes = row.counted_companion_types ?? [];

  const ritualLabel =
    row.is_brief_ritual === true
      ? t('archive.pauseRitualBrief', { defaultValue: 'Brief pause' })
      : t('archive.pauseRitualFull', { defaultValue: 'Full pause' });

  const interactionChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (row.has_initial_emotion_logged) {
      chips.push({ key: 'feel', label: t('archive.pauseIxFeel', { defaultValue: 'Feel' }) });
    }
    if (row.has_breath_completed) {
      chips.push({ key: 'breath', label: t('archive.pauseIxBreath', { defaultValue: 'Breathing' }) });
    }
    if (row.has_shift_emotion_logged) {
      chips.push({ key: 'shift', label: t('archive.pauseIxShift', { defaultValue: 'After check-in' }) });
    }
    if (row.has_outcome_logged) {
      chips.push({ key: 'outcome', label: t('archive.pauseIxOutcome', { defaultValue: 'Decision' }) });
    }
    if (typeof row.note_text === 'string' && row.note_text.trim().length > 0) {
      chips.push({ key: 'note', label: t('archive.pauseIxNote', { defaultValue: 'Notes' }) });
    }
    if (companionTypes.length > 0) {
      chips.push({ key: 'companions', label: t('archive.pauseIxCompanions', { defaultValue: 'Companions' }) });
    }
    return chips;
  }, [
    row.has_initial_emotion_logged,
    row.has_breath_completed,
    row.has_shift_emotion_logged,
    row.has_outcome_logged,
    row.note_text,
    companionTypes.length,
    t,
  ]);

  if (!id) return null;

  return (
    <>
    <Collapsible
      open={detailsOpen}
      onOpenChange={setDetailsOpen}
      className={cn(
        'w-full rounded-xl border border-border/40 bg-card/40 text-left transition-colors hover:bg-card/70',
        echoesPresentation && 'border-dashed border-nox-text-highlight/35',
      )}
    >
      <div className="px-3 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-full bg-muted/50 p-2 text-muted-foreground">
            <Pause className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                {echoesPresentation
                  ? t('archive.echoCardKind', { defaultValue: 'Echo' })
                  : t('archive.pauseCardKind', { defaultValue: 'Pause' })}
              </p>
              {timeAgo ? (
                <span className="shrink-0 text-[10px] text-muted-foreground/70">{timeAgo}</span>
              ) : null}
            </div>
            <p className="text-xs font-medium text-foreground/90">
              {row.state
                ? t(`pause.state.${row.state}`, { defaultValue: String(row.state) })
                : t('archive.pauseUntitled', { defaultValue: 'Pause session' })}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground/90">{ritualLabel}</p>
            {interactionChips.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {interactionChips.map((c) => (
                  <span
                    key={c.key}
                    className="rounded-full border border-border/35 bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {c.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] italic text-muted-foreground/60">
                {t('archive.pauseNoInteractions', { defaultValue: 'No ritual steps logged' })}
              </p>
            )}
            {showRetrospectiveCta ? (
              <p className="text-[10px] leading-snug text-muted-foreground/70">
                {t('archive.pauseCardRetrospectiveHint', {
                  defaultValue:
                    'This pause expired before you chose. You can still log what you did for your stats.',
                })}
              </p>
            ) : (
              <p className="text-[10px] leading-snug text-muted-foreground/70">
                {t('archive.pauseCardReadOnlyHint', {
                  defaultValue: 'Saved for your record — use Home or Library to start a new pause.',
                })}
              </p>
            )}
            {showRetrospectiveCta ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 w-full text-xs font-medium"
                onClick={() => setOutcomeSheetOpen(true)}
              >
                {t('archive.retrospectiveOpenCta', { defaultValue: 'Log decision' })}
              </Button>
            ) : null}
            {preview ? (
              <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{preview}</p>
            ) : (
              <p className="text-xs italic text-muted-foreground/60">
                {t('archive.noPreviewYet', { defaultValue: 'No summary yet' })}
              </p>
            )}
          </div>
        </div>
      </div>

      <CollapsibleTrigger
        id={`${collapsibleId}-trigger`}
        className="flex w-full items-center justify-center gap-1 border-t border-border/25 py-2 text-[11px] font-medium text-nox-text-link transition-colors hover:bg-card/90"
        aria-controls={`${collapsibleId}-content`}
      >
        {detailsOpen
          ? t('archive.pauseHideDetails', { defaultValue: 'Hide details' })
          : t('archive.pauseShowDetails', { defaultValue: 'Show details' })}
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200', detailsOpen && 'rotate-180')}
          aria-hidden
        />
      </CollapsibleTrigger>

      <CollapsibleContent
        id={`${collapsibleId}-content`}
        className="border-t border-border/20 px-3 pb-3 pt-2 data-[state=closed]:border-t-0"
        aria-labelledby={`${collapsibleId}-trigger`}
      >
        <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
          {row.outcome ? (
            <p>
              <span className="font-semibold text-foreground/80">
                {t('archive.pauseDetailOutcome', { defaultValue: 'Decision' })}:{' '}
              </span>
              {row.outcome}
            </p>
          ) : null}
          {companionTypes.length > 0 ? (
            <div>
              <p className="mb-1 font-semibold text-foreground/80">
                {t('archive.pauseDetailCompanions', { defaultValue: 'Companions used' })}
              </p>
              <ul className="list-inside list-disc space-y-0.5">
                {companionTypes.map((ct) => (
                  <li key={ct}>
                    {t(`archive.pauseCompanion_${ct}`, {
                      defaultValue: ct.replace(/([A-Z])/g, ' $1').trim(),
                    })}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {preview ? (
            <div>
              <p className="mb-1 font-semibold text-foreground/80">
                {t('archive.pauseDetailReflection', { defaultValue: 'Reflection' })}
              </p>
              <p className="whitespace-pre-wrap text-muted-foreground/90">{previewExpanded}</p>
            </div>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
    <ArchivePauseRetrospectiveOutcomeSheet
      row={row}
      open={outcomeSheetOpen}
      onOpenChange={setOutcomeSheetOpen}
      onSuccess={onOutcomeLogged}
    />
    </>
  );
}
