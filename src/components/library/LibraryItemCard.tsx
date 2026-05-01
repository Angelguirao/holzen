import { useMemo } from 'react';
import { zoomOutBodyPreviewFromJsonString } from '@/lib/zoom-out-payload';
import { librarySourceLabel } from '@/lib/library-source-label';
import { Heart, Pause, Radio, Leaf, Feather, Telescope, ScrollText, Pencil, Link as LinkIcon, FileText, type LucideIcon } from 'lucide-react';
import type { LibraryItem } from '@/hooks/use-library';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { normalizeLibrarySourceType } from '@/lib/normalize-library-source-type';
import type { PauseInstanceArchiveMeta } from '@/lib/archive-segment';
import { OutcomeIcon } from '@/components/icons/OutcomeIcon';

interface Props {
  item: LibraryItem;
  onToggleFavorite: (id: string) => void;
  onClick?: () => void;
  engaged?: boolean;
  incomplete?: boolean;
  /** Echoes tab: unify card kind label (“Reflection”). */
  echoesPresentation?: boolean;
  /** Main pause row: optional session summary from `v_pause_full` + reflection outcome. */
  showPauseSessionSummary?: boolean;
  pauseArchiveMeta?: PauseInstanceArchiveMeta;
  reflectionOutcome?: string | null;
}

/** Map `pause_companion_events.companion_type` / DB array values to `librarySources` keys. */
function countedCompanionTypeToSourceKey(ct: string): string {
  if (ct === 'ground_nudge') return 'grounding';
  if (ct === 'zoom_out_deep_time') return 'zoom_out';
  if (ct === 'historical_insight') return 'history_insight';
  return ct;
}

const SOURCE_ICONS: Record<string, LucideIcon> = {
  pause: Pause,
  signal: Radio,
  grounding: Leaf,
  learning: Leaf,
  ground: Leaf,
  haiku: Feather,
  zoom_out: Telescope,
  history_insight: ScrollText,
  pause_note: Pencil,
  external: LinkIcon,
  practice: Pencil,
};

// HSL-based color accents per source type (uses design system hues)
const SOURCE_COLORS: Record<string, string> = {
  pause: 'border-l-primary/40',
  signal: 'border-l-[hsl(200,50%,50%)]/40',
  grounding: 'border-l-[hsl(150,40%,45%)]/40',
  learning: 'border-l-[hsl(150,40%,45%)]/40',
  haiku: 'border-l-[hsl(280,40%,55%)]/40',
  zoom_out: 'border-l-[hsl(30,50%,50%)]/40',
  history_insight: 'border-l-[hsl(45,60%,50%)]/40',
  pause_note: 'border-l-muted-foreground/30',
  external: 'border-l-[hsl(210,30%,50%)]/40',
  ground: 'border-l-[hsl(140,40%,40%)]/40',
  practice: 'border-l-[hsl(260,40%,50%)]/40',
};

export function LibraryItemCard({
  item,
  onToggleFavorite,
  onClick,
  engaged = true,
  incomplete = false,
  echoesPresentation = false,
  showPauseSessionSummary = false,
  pauseArchiveMeta,
  reflectionOutcome = null,
}: Props) {
  const { t } = useTranslation();

  const preview = useMemo(() => {
    if (!item.body) return null;
    let text = typeof item.body === 'string' ? item.body : JSON.stringify(item.body);
    if (item.source_type === 'zoom_out' && text.startsWith('{')) {
      const preview = zoomOutBodyPreviewFromJsonString(text);
      if (preview !== null) text = preview;
    }
    return text.length > 120 ? text.slice(0, 120) + '…' : text;
  }, [item.body, item.source_type]);

  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    } catch {
      return '';
    }
  }, [item.created_at]);

  const isNew = useMemo(() => {
    try {
      return differenceInHours(new Date(), new Date(item.created_at)) < 24 && item.status === 'unread';
    } catch {
      return false;
    }
  }, [item.created_at, item.status]);

  const engagedSummary = useMemo(() => {
    if (!showPauseSessionSummary || !pauseArchiveMeta) return null;
    if (pauseArchiveMeta.engaged_at) {
      try {
        return t('library.pauseCardReflectOpened', {
          defaultValue: 'Reflect opened {{when}}',
          when: formatDistanceToNow(new Date(pauseArchiveMeta.engaged_at), { addSuffix: true }),
        });
      } catch {
        return null;
      }
    }
    return t('library.pauseCardReflectNotOpened', { defaultValue: 'Reflect not opened yet' });
  }, [showPauseSessionSummary, pauseArchiveMeta, t]);

  const companionTypeChips = useMemo(() => {
    if (!showPauseSessionSummary || !pauseArchiveMeta?.counted_companion_types?.length) return [];
    const raw = pauseArchiveMeta.counted_companion_types;
    const max = 4;
    return raw.slice(0, max).map((ct) => ({
      key: ct,
      label: librarySourceLabel(countedCompanionTypeToSourceKey(ct), t, ct),
    }));
  }, [showPauseSessionSummary, pauseArchiveMeta, t]);

  const st = normalizeLibrarySourceType(item.source_type) ?? '';
  const CategoryIcon = SOURCE_ICONS[st] ?? FileText;
  const sourceBadgeLabel = echoesPresentation
    ? t('library.echoesCardKind', { defaultValue: 'Reflection' })
    : librarySourceLabel(st || undefined, t, item.type ?? 'Item');
  const isCompanion =
    st && !['pause', 'pause_note', 'ground', 'practice', 'external'].includes(st);
  // Only show as skipped if the pause is complete (has outcome) and user didn't engage
  const dimmed = isCompanion && !engaged && !incomplete;

  const sourceColor = SOURCE_COLORS[st] ?? 'border-l-transparent';

  return (
    <div
      className={cn(
        'group flex items-start gap-2.5 rounded-lg border-l-2 px-3 py-2.5 transition-colors hover:bg-card/80 cursor-pointer mb-0 pb-[16px] pt-[16px]',
        sourceColor,
        dimmed && 'opacity-40'
      )}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onClick?.();
      }}
    >
      <div className="flex-1 min-w-0 space-y-1">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-foreground/20 bg-foreground/5 text-foreground text-xs font-sans whitespace-nowrap">
          <CategoryIcon className="h-3 w-3" />
          {sourceBadgeLabel}
        </span>
        <div className="flex items-center gap-1.5">
          {item.title && item.title !== 'Reflection' && (
            <p className="text-xs font-medium text-foreground leading-snug truncate">{item.title}</p>
          )}
          {isNew && (
            <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
          {incomplete && (
            <span className="shrink-0 text-[8px] font-mono text-destructive/60 uppercase tracking-wider">incomplete</span>
          )}
          {dimmed && (
            <span className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-wider">skipped</span>
          )}
        </div>
        {preview && (
          <p className="leading-relaxed line-clamp-2 font-sans text-sm text-secondary-foreground">
            {item.source_type === 'haiku' ? (
              <span className="italic">{preview}</span>
            ) : preview}
          </p>
        )}
        {showPauseSessionSummary && (
          <div className="flex flex-col gap-1.5 pt-1">
            {reflectionOutcome ? (
              <span className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-md border border-border/40 bg-muted/30 px-2 py-1 text-xs text-foreground">
                <OutcomeIcon outcome={reflectionOutcome} size={14} className="shrink-0 text-primary/70" />
                <span className="truncate font-medium">
                  {t(`outcome.${reflectionOutcome}`, { defaultValue: reflectionOutcome })}
                </span>
              </span>
            ) : incomplete ? (
              <span className="text-xs text-muted-foreground">
                {t('library.pauseCardOutcomePending', { defaultValue: 'Outcome not recorded' })}
              </span>
            ) : null}
            {engagedSummary ? (
              <span className="text-xs text-muted-foreground leading-snug">{engagedSummary}</span>
            ) : null}
            {pauseArchiveMeta?.has_breath_completed ? (
              <span className="inline-flex w-fit rounded-md border border-border/30 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {t('library.pauseCardBreathDone', { defaultValue: 'Breathing completed' })}
              </span>
            ) : null}
            {companionTypeChips.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                <span className="w-full text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  {t('library.pauseCardEngagementTypes', { defaultValue: 'Engagement' })}
                </span>
                {companionTypeChips.map(({ key, label }) => (
                  <span
                    key={key}
                    className="inline-flex max-w-[9rem] truncate rounded-full border border-border/35 bg-foreground/[0.04] px-2 py-0.5 text-[11px] text-secondary-foreground"
                  >
                    {label}
                  </span>
                ))}
                {(pauseArchiveMeta?.counted_companion_types?.length ?? 0) > 4 ? (
                  <span className="text-[11px] text-muted-foreground">
                    {t('library.pauseCardMoreTypes', { defaultValue: '+ more' })}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
        <p className="text-muted-foreground/35 pt-0.5 text-sm font-sans">{timeAgo}</p>
      </div>

      <button
        onClick={() => onToggleFavorite(item.id)}
        className={`p-1 mt-0.5 shrink-0 transition-colors ${item.is_favorite ? 'text-primary' : 'text-muted-foreground/40'}`}
        aria-label={item.is_favorite ? t('libraryCard.removeFavorite') : t('libraryCard.addFavorite')}
      >
        <Heart className={`h-3.5 w-3.5 ${item.is_favorite ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
}
