export const PAUSE_SCIENCE_STEP_KEYS = [
  'feel',
  'breathe',
  'reflect',
  'frame',
  'breath2',
  'decide',
] as const;

export type PauseScienceStepKey = (typeof PAUSE_SCIENCE_STEP_KEYS)[number];

export type PauseScienceSource = {
  label: string;
  url: string;
};

export type PauseScienceStepConfig = {
  key: PauseScienceStepKey;
  sources: readonly PauseScienceSource[];
};

export const PAUSE_SCIENCE_STEPS: readonly PauseScienceStepConfig[] = [
  {
    key: 'feel',
    sources: [
      {
        label: 'Lieberman, M. D. et al. (2007). Putting feelings into words. Psychological Science, 18(5), 421–428.',
        url: 'https://doi.org/10.1111/j.1467-9280.2007.01916.x',
      },
    ],
  },
  {
    key: 'breathe',
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
    key: 'reflect',
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
    key: 'frame',
    sources: [
      {
        label: 'Flavell, J. H. (1979). Metacognition and cognitive monitoring. American Psychologist, 34(10), 906–911.',
        url: 'https://www.researchgate.net/publication/232599909_Metacognition_and_cognitive_monitoring_A_new_area_of_cognitive-developmental_inquiry',
      },
    ],
  },
  {
    key: 'breath2',
    sources: [
      {
        label: 'Lehrer, P. & Gevirtz, R. (2014). Heart rate variability biofeedback. Frontiers in Psychology, 5, 756.',
        url: 'https://doi.org/10.3389/fpsyg.2014.00756',
      },
    ],
  },
  {
    key: 'decide',
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
];
