import type { SignalPayload } from '@/features/pause/domain/signal-payload';
import { SignalReadFullStoryButton } from '@/screens/pause/components/companion/signal-read-full-story-button';

export type SignalFrameDisplayProps = {
  signal: SignalPayload;
  pauseInstanceId: string;
};

function truncateExcerpt(body: string, maxChars = 220): string {
  const trimmed = body.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const slice = trimmed.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > maxChars * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

/** Frame accordion Signal — title → byline → excerpt → Read the full story (Figma 435:16214). */
export function SignalFrameDisplay({ signal, pauseInstanceId }: SignalFrameDisplayProps) {
  "use memo";
  const excerpt = truncateExcerpt(signal.body);

  return (
    <div className="flex w-full flex-col gap-2 pt-4">
      {signal.title ? (
        <p className="text-sm font-medium leading-5 tracking-wide text-foreground">{signal.title}</p>
      ) : null}
      {signal.source ? (
        <p className="text-sm font-medium leading-5 tracking-wide text-muted-foreground">{signal.source}</p>
      ) : null}
      {excerpt ? (
        <p className="pb-2 text-sm leading-5 tracking-wide text-foreground">{excerpt}</p>
      ) : null}
      <SignalReadFullStoryButton pauseInstanceId={pauseInstanceId} className="py-4" />
    </div>
  );
}
