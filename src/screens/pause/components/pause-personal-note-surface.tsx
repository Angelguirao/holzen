import { Binoculars, StickyNote } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type PausePersonalNoteSurfaceVariant = 'post-it' | 'waypoint';

export type PausePersonalNoteSurfaceProps = {
  variant: PausePersonalNoteSurfaceVariant;
  body: string;
  onChange: () => void;
};

const VARIANT_CONFIG = {
  'post-it': {
    Icon: StickyNote,
    labelKey: 'pause.reflect.savedPostItLabel',
    labelDefault: 'Your post-it',
    changeKey: 'pause.reflect.changePostIt',
    changeDefault: 'Change',
  },
  waypoint: {
    Icon: Binoculars,
    labelKey: 'pause.frame.zoomOutContent.yourWaypoint',
    labelDefault: 'YOUR WAYPOINT',
    changeKey: 'pause.frame.zoomOutContent.changeWaypoint',
    changeDefault: 'Change',
  },
} as const;

/** Saved personal note block — reflect post-it (StickyNote) vs frame waypoint (Binoculars). Figma 432:9226 / reflect card. */
export function PausePersonalNoteSurface({ variant, body, onChange }: PausePersonalNoteSurfaceProps) {
  "use memo";
  const { t } = useTranslation();
  const { Icon, labelKey, labelDefault, changeKey, changeDefault } = VARIANT_CONFIG[variant];
  const trimmed = body.trim();
  if (!trimmed) return null;

  return (
    <div className="w-full min-w-0 space-y-2.5 rounded-lg bg-primary/10 p-4">
      <div className="flex min-w-0 items-start gap-2.5">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="min-w-0 flex-1 text-base leading-6 text-primary [overflow-wrap:anywhere]">
          {t(labelKey, { defaultValue: labelDefault })}
        </p>
        <button
          type="button"
          onClick={onChange}
          className="shrink-0 text-sm leading-5 text-primary underline underline-offset-2"
        >
          {t(changeKey, { defaultValue: changeDefault })}
        </button>
      </div>
      <p className="max-h-40 min-w-0 overflow-y-auto whitespace-pre-wrap break-words text-base italic leading-6 text-primary/90 [overflow-wrap:anywhere]">
        &ldquo;{trimmed}&rdquo;
      </p>
    </div>
  );
}
