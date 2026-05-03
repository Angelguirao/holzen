import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const SECTIONS = [
  'holzen',
  'challenge',
  'ninety',
  'mechanisms',
  'sixSteps',
  'ritual',
] as const;

export function PauseAboutPausesBody() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 pb-4">
      <div className="space-y-1 pb-4">
        <h2 className="text-lg font-semibold text-foreground">{t('pause.aboutPauses.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('pause.aboutPauses.subtitle')}</p>
      </div>

      {SECTIONS.map((key) => (
        <Collapsible key={key} defaultOpen={key === 'holzen' || key === 'challenge'} className="border-b border-border/50 py-1">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 py-3 text-left text-sm font-medium text-foreground hover:text-primary">
            {t(`pause.aboutPauses.sections.${key}.title`)}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div
              className={cn(
                'space-y-3 pb-4 text-sm leading-relaxed text-muted-foreground',
                '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
              )}
            >
              <p>{t(`pause.aboutPauses.sections.${key}.body`)}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
