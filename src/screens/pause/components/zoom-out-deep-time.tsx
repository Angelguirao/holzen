import { Globe } from 'lucide-react';
import type { ZoomOutData } from '@/features/pause/public-hooks';

export type ZoomOutDeepTimeProps = {
  deepTime: NonNullable<ZoomOutData['deepTime']>;
};

/** Civilizational / planetary perspective block in zoom-out. */
export function ZoomOutDeepTime({ deepTime }: ZoomOutDeepTimeProps) {
  return (
    <div className="rounded-lg border border-primary/10 bg-primary/[0.03] px-4 py-3.5 space-y-2">
      <div className="flex items-center gap-1.5">
        <Globe className="h-3 w-3 text-muted-foreground/50" />
        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Deep time</p>
      </div>
      <p className="text-[10px] font-mono text-foreground/70 uppercase tracking-wide leading-snug">
        {deepTime.title}
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">{deepTime.body}</p>
    </div>
  );
}
