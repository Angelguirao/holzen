import en from '../../../../src/locales/en.json';

/** Mirrors `src/features/subscription/domain/pricing.ts` — keep in sync for marketing copy. */
export const LANDING_PRICING = {
  monthlyPrice: 4.99,
  trialDays: 7,
} as const;

const landing = en.landing;
const common = en.common;

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ''));
}

const priceVars = {
  price: LANDING_PRICING.monthlyPrice.toFixed(2),
  trialDays: LANDING_PRICING.trialDays,
};

export const landingCopy = {
  meta: {
    title: 'Holzen — When Bitcoin moves, pause before you do',
    description:
      'Volatility-triggered pause practice for investors. Holzen watches Bitcoin moves and guides you through a science-backed ritual — not advice, just space to choose deliberately.',
    path: '/welcome',
  },
  signIn: common.signIn,
  hero: landing.hero,
  heroDesc: landing.heroDesc,
  getStartedForFree: landing.getStartedForFree,
  noCreditCard: interpolate(landing.noCreditCard, priceVars),
  reflectionLoop: landing.reflectionLoop,
  reaction: {
    label: landing.reaction.label,
    steps: [
      landing.reaction['01title'],
      landing.reaction['02title'],
      landing.reaction['03title'],
      landing.reaction['04title'],
    ],
  },
  reflection: {
    label: landing.reflection.label,
    steps: [
      landing.reflection['01title'],
      landing.reflection['02title'],
      landing.reflection['03title'],
      landing.reflection['04title'],
      landing.reflection['05title'],
      landing.reflection['06title'],
    ],
  },
  companionsTitle: landing.companionsTitle,
  companionsDesc: landing.companionsDesc,
  companions: [
    { label: landing.companions.haiku, desc: landing.companions.haikuDesc },
    { label: landing.companions.signal, desc: landing.companions.signalDesc },
    { label: landing.companions.grounding, desc: landing.companions.groundingDesc },
    { label: landing.companions.zoomOut, desc: landing.companions.zoomOutDesc },
    { label: landing.companions.history, desc: landing.companions.historyDesc },
  ],
  scienceQuote: landing.scienceQuote,
  scienceDesc: landing.scienceDesc,
  scienceCitationLabel: landing.scienceCitationLabel,
  scienceCitationUrl: landing.scienceCitationUrl,
  scienceStepsTitle: landing.scienceStepsTitle,
  scienceStepsIntro: landing.scienceStepsIntro,
  scienceSteps: [
    {
      key: 'Feel',
      step: 1,
      body: landing.scienceStepFeel,
      sources: [
        {
          label: 'Lieberman et al. (2007). Affect labeling',
          url: 'https://doi.org/10.1111/j.1467-9280.2007.01916.x',
        },
      ],
    },
    {
      key: 'Breathe',
      step: 2,
      body: landing.scienceStepBreathe,
      sources: [
        {
          label: 'Porges (2011). The Polyvagal Theory',
          url: 'https://wwnorton.com/books/9780393707007',
        },
        {
          label: 'Lehrer & Gevirtz (2014). HRV biofeedback',
          url: 'https://doi.org/10.3389/fpsyg.2014.00756',
        },
      ],
    },
    {
      key: 'Reflect',
      step: 3,
      body: landing.scienceStepReflect,
      sources: [
        {
          label: 'Gross (2002). Emotion regulation',
          url: 'https://www.guilford.com/books/Handbook-of-Emotions/Lewis-Haviland-Jones-Barrett/9781462536368',
        },
        {
          label: 'Gross (1998). Integrative review',
          url: 'https://doi.org/10.1037/1089-2680.2.3.271',
        },
      ],
    },
    {
      key: 'Frame',
      step: 4,
      body: landing.scienceStepFrame,
      sources: [
        {
          label: 'Flavell (1979). Metacognition',
          url: 'https://www.researchgate.net/publication/232599909',
        },
      ],
    },
    {
      key: 'BreatheAgain',
      step: 5,
      body: landing.scienceStepBreatheAgain,
      sources: [
        {
          label: 'Lehrer & Gevirtz (2014). HRV biofeedback',
          url: 'https://doi.org/10.3389/fpsyg.2014.00756',
        },
      ],
    },
    {
      key: 'Decide',
      step: 6,
      body: landing.scienceStepDecide,
      sources: [
        {
          label: 'Kahneman (2011). Thinking, Fast and Slow',
          url: 'https://us.macmillan.com/books/9780374533557/thinkingfastandslow',
        },
        {
          label: 'Kahneman & Tversky (1974). Heuristics and biases',
          url: 'https://doi.org/10.1126/science.185.4157.1124',
        },
      ],
    },
  ] as const,
  whatYouGet: landing.whatYouGet,
  features: [
    { label: landing.features.pause, desc: landing.features.pauseDesc },
    { label: landing.features.companions, desc: landing.features.companionsDesc },
    { label: landing.features.detection, desc: landing.features.detectionDesc },
    { label: landing.features.mood, desc: landing.features.moodDesc },
    { label: landing.features.archive, desc: landing.features.archiveDesc },
    { label: landing.features.journey, desc: landing.features.journeyDesc },
    { label: landing.features.mantra, desc: landing.features.mantraDesc },
    { label: landing.features.pwa, desc: landing.features.pwaDesc },
    { label: landing.features.privacy, desc: landing.features.privacyDesc },
  ],
  freeToStart: interpolate(landing.freeToStart, priceVars),
  pricingDesc: interpolate(landing.pricingDesc, priceVars),
  questions: landing.questions,
  faq: [
    { key: 'who', q: landing.faq.whoQuestion, a: landing.faq.whoAnswer },
    { key: 'advice', q: landing.faq.adviceQuestion, a: landing.faq.adviceAnswer },
    { key: 'breathe', q: landing.faq.breatheQuestion, a: landing.faq.breatheAnswer },
    { key: 'meditation', q: landing.faq.meditationQuestion, a: landing.faq.meditationAnswer },
    {
      key: 'value',
      q: interpolate(landing.faq.valueQuestion, priceVars),
      a: interpolate(landing.faq.valueAnswer, priceVars),
    },
    { key: 'fairUse', q: landing.faq.fairUseQuestion, a: landing.faq.fairUseAnswer },
    { key: 'works', q: landing.faq.worksQuestion, a: landing.faq.worksAnswer },
    { key: 'rational', q: landing.faq.rationalQuestion, a: landing.faq.rationalAnswer },
    { key: 'data', q: landing.faq.dataQuestion, a: landing.faq.dataAnswer, privacyLink: true },
  ],
  footer: landing.footer,
  contact: landing.contact,
  about: landing.about,
  blog: landing.blog,
  terms: landing.terms,
  privacy: landing.privacy,
};

export function landingFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: landingCopy.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}
