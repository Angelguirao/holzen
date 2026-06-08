import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const SECTIONS = [
  'holzenChallenge',
  'ninetySeconds',
  'mechanisms',
  'sixSteps',
  'ritual',
] as const;

type SectionKey = (typeof SECTIONS)[number];

function AboutPausesSection({
  sectionKey,
  defaultOpen = false,
}: {
  sectionKey: SectionKey;
  defaultOpen?: boolean;
}) {
  const { t } = useTranslation();
  const body = t(`pause.aboutPauses.sections.${sectionKey}.body`);
  const paragraphs = body.split('\n\n').filter((paragraph) => paragraph.trim().length > 0);

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="rounded-2xl border-2 border-muted-foreground px-4 py-2"
    >
      <CollapsibleTrigger className="group flex w-full items-center gap-4 py-1 text-left">
        <span className="flex-1 text-base leading-6 text-foreground">
          {t(`pause.aboutPauses.sections.${sectionKey}.title`)}
        </span>
        <span className="shrink-0 rounded-full p-3">
          <ChevronDown
            className="h-5 w-5 text-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={cn('space-y-4 pb-4 pt-0 text-base leading-6 text-muted-foreground')}>
          {paragraphs.map((paragraph, index) => {
            const lines = paragraph.split('\n').filter((line) => line.trim().length > 0);
            if (lines.length <= 1) {
              return <p key={index}>{paragraph}</p>;
            }
            return (
              <div key={index} className="flex flex-col">
                {lines.map((line, lineIndex) => (
                  <p key={lineIndex} className="mb-0">
                    {line}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PauseAboutPausesBody() {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 pb-2">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-normal leading-8 text-foreground">
          {t('pause.aboutPauses.title', { defaultValue: 'Why pause?' })}
        </h2>
        <p className="text-base font-medium leading-6 tracking-[0.01em] text-foreground">
          {t('pause.aboutPauses.subtitle', { defaultValue: 'The science behind it' })}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {SECTIONS.map((key) => (
          <AboutPausesSection key={key} sectionKey={key} defaultOpen={key === 'holzenChallenge'} />
        ))}
      </div>
    </div>
  );
}
