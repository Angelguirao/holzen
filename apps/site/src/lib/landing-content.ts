import en from '../../../../src/locales/en.json';
import { MARKETING_SITE_ORIGIN } from './marketing-seo';

const landing = en.landing;

/** Waitlist landing — conversion-focused copy. Product i18n stays in en.json. */
export const landingCopy = {
  meta: {
    title: 'Holzen — Pause before you act when Bitcoin moves',
    description:
      'Volatility-triggered pause practice for Bitcoin investors. Get early access to a science-backed ritual that creates space between impulse and action — not financial advice.',
    path: '/welcome',
  },
  heroEyebrow: 'For Bitcoin investors',
  hero: 'Pause before impulse trades the move.',
  heroDesc:
    'Holzen detects volatility and walks you through a structured ritual — feel, breathe, reflect, decide. You stay in control of every trade.',
  heroAudience: 'Built for holders who want deliberate choices, not another signal app.',
  heroNote: 'Private beta · small batches · no payment to join the waitlist',
  trustSignals: ['Science-backed ritual', 'Not financial advice', 'Your data stays yours'],
  reflectionLoop: landing.reflectionLoop,
  reflectionLoopIntro:
    'The costliest moves often happen in the first few minutes. Holzen buys you that gap.',
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
  howItWorksTitle: 'How it works',
  howItWorksIntro: 'Four beats from alert to deliberate choice.',
  howItWorks: [
    { title: landing.steps['01title'], desc: landing.steps['01desc'] },
    { title: landing.steps['02title'], desc: landing.steps['02desc'] },
    { title: landing.steps['03title'], desc: landing.steps['03desc'] },
    { title: landing.steps['04title'], desc: landing.steps['04desc'] },
  ],
  benefitsTitle: 'Why Holzen',
  benefitsIntro: 'One practice, three outcomes — less reactivity, more clarity over time.',
  benefits: [
    {
      icon: 'pulse',
      title: 'Volatility-triggered pauses',
      desc: 'Alerts when Bitcoin crosses your thresholds — or start a pause yourself when you need one.',
    },
    {
      icon: 'ritual',
      title: 'Structured ritual',
      desc: 'Feel, breathe, reflect, frame, breathe again, decide — sequenced from behavioral research.',
    },
    {
      icon: 'patterns',
      title: 'Pattern tracking',
      desc: 'Log moods and outcomes. Your archive shows how composure evolves across volatile weeks.',
    },
  ],
  scienceQuote: landing.scienceQuote,
  scienceDesc: landing.scienceDesc,
  scienceCitationLabel: 'Read the research ↗',
  scienceCitationUrl: landing.scienceCitationUrl,
  waitlistTitle: 'Get early access',
  waitlistDesc: 'We invite in small batches. Leave your email — one message when your spot opens.',
  questions: 'Questions',
  faq: [
    { key: 'who', q: landing.faq.whoQuestion, a: landing.faq.whoAnswer },
    { key: 'advice', q: landing.faq.adviceQuestion, a: landing.faq.adviceAnswer },
    {
      key: 'waitlist',
      q: 'How do I get access?',
      a: 'Join above with your email. No payment or app signup required. We onboard in small batches and email you when it is your turn.',
    },
    { key: 'meditation', q: landing.faq.meditationQuestion, a: landing.faq.meditationAnswer },
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

export function landingWebPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: landingCopy.meta.title,
    description: landingCopy.meta.description,
    url: `${MARKETING_SITE_ORIGIN}${landingCopy.meta.path}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Holzen',
      url: MARKETING_SITE_ORIGIN,
    },
  };
}

