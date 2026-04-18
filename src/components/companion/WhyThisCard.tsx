import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  /** User's mood key at pause time (e.g. `anxious`, `restless`). `null` when unavailable. */
  mood?: string | null;
  /** `up` / `down` / `neutral` or `null` if we never parsed one. */
  marketDirection?: 'up' | 'down' | 'neutral' | null;
  /** Session intent label — e.g. "loss-aversion", "fomo-herd". `null` when absent. */
  preferredBias?: string | null;
  /** Which companion this belongs to — used to pick copy ("this Ground card" vs "this Signal"). */
  companion: 'signal' | 'grounding' | 'history' | 'zoomOut';
  className?: string;
}

/**
 * Collapsible "Why this card now?" disclosure for Full View pages.
 *
 * Transparent about the three inputs the orchestrator actually uses to pick
 * a companion slot (mood, market direction, session `preferredBias`) so the
 * content feels reasoned-about rather than random. Renders nothing if none of
 * the three inputs are known — we don't want to show an empty "because …" UI.
 */
export function WhyThisCard({ mood, marketDirection, preferredBias, companion, className = '' }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const knownCount = [mood, marketDirection, preferredBias].filter(Boolean).length;
  if (knownCount === 0) return null;

  const moodLabel = mood ? t(`companions.fullview.whyThis.mood.${mood}`, { defaultValue: mood }) : null;
  const dirLabel =
    marketDirection && marketDirection !== 'neutral'
      ? t(`companions.fullview.whyThis.direction.${marketDirection}`)
      : null;
  const biasLabel = preferredBias
    ? t(`companions.fullview.whyThis.bias.${preferredBias}`, { defaultValue: preferredBias.replace(/[-_]/g, ' ') })
    : null;

  return (
    <div className={`text-[11px] font-mono ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-muted-foreground/55 hover:text-muted-foreground transition-colors"
        aria-expanded={open}
      >
        <ChevronDown
          className={`h-2.5 w-2.5 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
        <span>{t('companions.fullview.whyThis.trigger')}</span>
      </button>

      {open && (
        <p className="pt-1.5 pl-3.5 text-muted-foreground/70 leading-relaxed">
          {t(`companions.fullview.whyThis.body.${companion}`, {
            mood: moodLabel ?? t('companions.fullview.whyThis.unknownMood'),
            direction: dirLabel ?? t('companions.fullview.whyThis.unknownDirection'),
            bias: biasLabel ?? t('companions.fullview.whyThis.unknownBias'),
            defaultValue: t('companions.fullview.whyThis.body.fallback', {
              mood: moodLabel,
              direction: dirLabel,
              bias: biasLabel,
            }),
          })}
        </p>
      )}
    </div>
  );
}
