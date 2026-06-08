import { format } from 'date-fns';
import { Binoculars, CirclePlus, Globe, StickyNote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { EchoUserWord, ZoomOutData, ZoomOutEchoData } from '@/features/pause/public-ritual-frame';

const OUTCOME_LABELS: Record<string, string> = {
  held: 'Held',
  hold: 'Held',
  sold: 'Sold',
  bought: 'Bought',
  nothing: 'Held',
};

function formatEchoTag(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function formatPostItDate(createdAt: string): string {
  return format(new Date(createdAt), 'MMM d, yyyy').toUpperCase();
}

function getWaypointEntry(userWords: EchoUserWord[]): EchoUserWord | null {
  if (userWords.length <= 1) return null;
  return userWords[userWords.length - 1] ?? null;
}

type ZoomOutFrameDisplayProps = {
  data: ZoomOutData;
  onGoToReplay: () => void;
};

function ZoomOutFrameDeepTime({ deepTime }: { deepTime: NonNullable<ZoomOutData['deepTime']> }) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="space-y-2.5 rounded-lg bg-muted p-3">
      <div className="flex items-start gap-2.5">
        <Globe className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="space-y-0 italic text-base leading-6 text-muted-foreground">
          <p>{t('pause.frame.zoomOutContent.deepTimeLabel')}</p>
          <p>{deepTime.title}</p>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-base leading-6 text-foreground">{deepTime.body}</p>
    </div>
  );
}

function ZoomOutFrameEchoCard({
  echo,
  primary,
}: {
  echo: ZoomOutEchoData;
  primary: EchoUserWord;
}) {
  "use memo";
  const { t } = useTranslation();
  const moodTag = echo.mood ? `[${formatEchoTag(echo.mood)}]` : null;
  const outcomeTag = echo.outcome
    ? `[${OUTCOME_LABELS[echo.outcome] ?? formatEchoTag(echo.outcome)}]`
    : null;
  const tags = [moodTag, outcomeTag].filter(Boolean).join(' ');

  return (
    <div className="space-y-2.5 rounded-lg border-2 border-muted-foreground/40 p-3">
      <div className="flex items-start gap-2.5">
        <StickyNote className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="space-y-0 italic text-base leading-6 text-muted-foreground">
          <p>
            {t('pause.frame.zoomOutContent.postItLabel')} · {formatPostItDate(primary.created_at)}
          </p>
          <p>&ldquo;{primary.body}&rdquo;</p>
          {tags ? <p>{tags}</p> : null}
        </div>
      </div>
      <p className="whitespace-pre-wrap text-base leading-6 text-foreground">{t('companions.echoFraming')}</p>
    </div>
  );
}

function ZoomOutFramePrompts() {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="whitespace-pre-wrap py-2 text-base leading-6 text-foreground">
      <p>{t('pause.frame.zoomOutContent.promptIntro')}</p>
      <p>· {t('pause.frame.zoomOutContent.prompt1')}</p>
      <p>· {t('pause.frame.zoomOutContent.prompt2')}</p>
      <p>· {t('pause.frame.zoomOutContent.prompt3')}</p>
    </div>
  );
}

function ZoomOutFrameDropWaypoint({ onClick }: { onClick: () => void }) {
  "use memo";
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
    >
      <CirclePlus className="h-5 w-5" aria-hidden />
      {t('pause.frame.zoomOutContent.dropWaypoint')}
    </button>
  );
}

function ZoomOutFrameYourWaypoint({
  body,
  onChange,
}: {
  body: string;
  onChange: () => void;
}) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="space-y-2.5 bg-primary/10 p-4">
      <div className="flex items-start gap-2.5">
        <Binoculars className="h-6 w-6 shrink-0 text-primary" aria-hidden />
        <p className="flex-1 text-base leading-6 text-primary">
          {t('pause.frame.zoomOutContent.yourWaypoint')}
        </p>
        <button
          type="button"
          onClick={onChange}
          className="shrink-0 text-sm leading-5 text-primary underline underline-offset-2"
        >
          {t('pause.frame.zoomOutContent.changeWaypoint')}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-base italic leading-6 text-primary/90">&ldquo;{body}&rdquo;</p>
    </div>
  );
}

/** Frame accordion Zoom out — deep time, echo post-it, prompts, waypoint (Figma 362:15111 / 366:15946 / 432:8982). */
export function ZoomOutFrameDisplay({ data, onGoToReplay }: ZoomOutFrameDisplayProps) {
  "use memo";
  const { t } = useTranslation();
  const { echo, deepTime } = data;
  const userWords = echo?.userWords ?? [];
  const primary = userWords[0];
  const hasEcho = Boolean(primary);
  const hasContent = Boolean(deepTime) || hasEcho;
  const waypointEntry = getWaypointEntry(userWords);

  if (!hasContent) {
    return (
      <div className="space-y-2 pb-2 pt-2">
        <p className="text-base leading-6 text-foreground">{t('pause.frame.zoomOutContent.emptyTitle')}</p>
        <p className="text-base leading-6 text-muted-foreground">{t('pause.frame.zoomOutContent.emptyBody')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-2 pt-2">
      <p className="text-base leading-6 text-foreground">
        {t(hasEcho ? 'pause.frame.zoomOutContent.storyLead' : 'pause.frame.zoomOutContent.lead')}
      </p>

      {deepTime ? <ZoomOutFrameDeepTime deepTime={deepTime} /> : null}

      {hasEcho && primary && echo ? (
        <>
          <ZoomOutFrameEchoCard echo={echo} primary={primary} />
          <ZoomOutFramePrompts />
          {echo.id ? (
            waypointEntry ? (
              <ZoomOutFrameYourWaypoint body={waypointEntry.body} onChange={onGoToReplay} />
            ) : (
              <ZoomOutFrameDropWaypoint onClick={onGoToReplay} />
            )
          ) : null}
        </>
      ) : null}
    </div>
  );
}
