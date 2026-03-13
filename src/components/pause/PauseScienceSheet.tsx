import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Wind, Heart, BookOpen, RefreshCw, Target, ExternalLink } from 'lucide-react';

interface ResearchLink {
  label: string;
  url: string;
}

const STEPS = [
  {
    key: 'breathe',
    icon: Wind,
    sources: [
      {
        label: 'Porges, 2011 — Polyvagal Theory',
        url: 'https://doi.org/10.1093/acprof:oso/9780393707007.001.0001',
      },
    ],
  },
  {
    key: 'feel',
    icon: Heart,
    sources: [
      {
        label: 'Lieberman et al., 2007 — Affect Labeling',
        url: 'https://doi.org/10.1111/j.1467-9280.2007.01916.x',
      },
    ],
  },
  {
    key: 'reflect',
    icon: BookOpen,
    sources: [
      {
        label: 'Gross, 2002 — Emotion Regulation',
        url: 'https://doi.org/10.1037/0033-295X.109.2.281',
      },
    ],
  },
  {
    key: 'shift',
    icon: RefreshCw,
    sources: [
      {
        label: 'Flavell, 1979 — Metacognition',
        url: 'https://doi.org/10.1037/0003-066X.34.10.906',
      },
    ],
  },
  {
    key: 'decide',
    icon: Target,
    sources: [
      {
        label: 'Kahneman, 2011 — Thinking, Fast and Slow',
        url: 'https://en.wikipedia.org/wiki/Thinking,_Fast_and_Slow',
      },
    ],
  },
] as const;

export function PauseScienceSheet() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="text-[8px] font-mono text-muted-foreground/25 hover:text-muted-foreground/50 transition-colors duration-500 tracking-[0.12em] uppercase">
          {t('pauseScience.whyThisOrder')}
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <div className="px-6 pt-4 pb-8 space-y-6 overflow-y-auto">
          <p className="text-xs font-mono tracking-[0.15em] uppercase text-muted-foreground/60">
            {t('pauseScience.title')}
          </p>
          <div className="space-y-5">
            {STEPS.map(({ key, icon: Icon, sources }) => (
              <div key={key} className="flex gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
                  <Icon className="h-3 w-3 text-muted-foreground/60" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">
                    {t(`pauseScience.${key}`)}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t(`pauseScience.${key}Desc`)}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {sources.map((source) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] font-mono text-primary/60 hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        {source.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
