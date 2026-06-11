import en from '../../../../src/locales/en.json';

const about = en.about;
const landing = en.landing;

export const aboutCopy = {
  meta: {
    title: 'About Holzen — Pause before you act',
    description:
      'Holzen applies behavioral finance research to help investors pause before acting on impulse. Starting with Bitcoin volatility. Built by a husband-and-wife team, small by design.',
    path: '/about',
  },
  back: en.common.back,
  title: about.whyHolzenExists,
  sections: [
    {
      label: about.opportunityProblem,
      lead: about.opportunityBody1,
      paragraphs: [about.opportunityBody2, about.opportunityBody3, about.opportunityBody4],
    },
    {
      label: about.whatResearchSays,
      lead: about.researchBody1,
      paragraphs: [about.researchBody2, about.researchBody3, about.researchBody4],
    },
    {
      label: about.pauseResearchTitle,
      lead: about.pauseResearchIntro,
      paragraphs: [landing.scienceStepsSummary],
      link: { href: '/welcome#science', label: about.readFullScience },
    },
    {
      label: about.whyBitcoin,
      lead: about.bitcoinBody1,
      paragraphs: [about.bitcoinBody2, about.bitcoinBody3, about.bitcoinBody4],
    },
    {
      label: about.ourPhilosophy,
      lead: about.philosophyBody1,
      paragraphs: [about.philosophyBody2, about.philosophyBody3],
    },
    {
      label: about.reserveLabel,
      lead: about.reserveBody1,
      paragraphs: [about.reserveBody2],
    },
    {
      label: about.aboutUs,
      paragraphs: [about.aboutUsBody1, about.aboutUsBody2],
    },
  ],
};
