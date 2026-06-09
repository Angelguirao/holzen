import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Shared Done hero: checkmark + "You paused" copy (Figma post-decide summary). */
export function PauseDoneCompletionHero() {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-4">
      <CheckCircle2 size={44} strokeWidth={1.25} className="text-foreground" aria-hidden />
      <div className="flex max-w-sm flex-col gap-2 text-center">
        <h2 className="text-[22px] font-normal leading-7 tracking-tight text-foreground">
          {t('pause.done.heroTitle')}
        </h2>
        <p className="text-sm leading-5 tracking-wide text-foreground">
          {t('pause.done.heroSubcopy')}
        </p>
      </div>
    </div>
  );
}
