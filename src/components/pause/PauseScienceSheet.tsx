import { useTranslation } from 'react-i18next';
import { Wind, Heart, BookOpen, RefreshCw, Target, ExternalLink } from 'lucide-react';

const STEPS = [
  {
    key: 'breathe',
    icon: Wind,
    sources: [
      {
        label: 'Porges, S. W. (2011). The Polyvagal Theory. W. W. Norton.',
        url: 'https://wwnorton.com/books/9780393707007',
      },
      {
        label: 'Lehrer, P. & Gevirtz, R. (2014). Heart rate variability biofeedback. Frontiers in Psychology, 5, 756.',
        url: 'https://doi.org/10.3389/fpsyg.2014.00756',
      },
    ],
  },
  {
    key: 'feel',
    icon: Heart,
    sources: [
      {
        label: 'Lieberman, M. D. et al. (2007). Putting feelings into words. Psychological Science, 18(5), 421–428.',
        url: 'https://doi.org/10.1111/j.1467-9280.2007.01916.x',
      },
    ],
  },
  {
    key: 'reflect',
    icon: BookOpen,
    sources: [
      {
        label: 'Gross, J. J. (2002). Emotion regulation: Affective, cognitive, and social consequences. Handbook of Emotions.',
        url: 'https://www.guilford.com/books/Handbook-of-Emotions/Lewis-Haviland-Jones-Barrett/9781462536368',
      },
      {
        label: 'Gross, J. J. (1998). The emerging field of emotion regulation. Review of General Psychology, 2(3), 271–299.',
        url: 'https://doi.org/10.1037/1089-2680.2.3.271',
      },
    ],
  },
  {
    key: 'shift',
    icon: RefreshCw,
    sources: [
      {
        label: 'Flavell, J. H. (1979). Metacognition and cognitive monitoring. American Psychologist, 34(10), 906–911.',
        url: 'https://www.researchgate.net/publication/232599909_Metacognition_and_cognitive_monitoring_A_new_area_of_cognitive-developmental_inquiry',
      },
    ],
  },
  {
    key: 'decide',
    icon: Target,
    sources: [
      {
        label: 'Kahneman, D. (2011). Thinking, Fast and Slow. Farrar, Straus and Giroux.',
        url: 'https://us.macmillan.com/books/9780374533557/thinkingfastandslow',
      },
      {
        label: 'Kahneman, D. & Tversky, A. (1974). Judgment under uncertainty. Science, 185(4157), 1124–1131.',
        url: 'https://doi.org/10.1126/science.185.4157.1124',
      },
    ],
  },
] as const;

/** Scrollable “science behind the pause” body for use inside a bottom sheet / drawer. */
export function PauseScienceScrollBody() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 px-1 pb-6 pt-2">
      <p className="text-sm font-medium text-muted-foreground">{t('pauseScience.title')}</p>
      <div className="space-y-5">
        {STEPS.map(({ key, icon: Icon, sources }) => (
          <div key={key} className="flex gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/60">
              <Icon className="h-3 w-3 text-muted-foreground/60" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">{t(`pauseScience.${key}`)}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(`pauseScience.${key}Desc`)}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1 break-words text-xs text-primary underline-offset-2 hover:underline"
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
  );
}
