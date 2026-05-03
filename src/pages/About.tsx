import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { PublicFooter } from '@/components/PublicFooter';
import { PageHeading } from '@/components/PageHeading';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
});

const About = () => {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const m = (delay = 0) => (prefersReduced ? {} : fade(delay));

  return (
    <div className="min-h-screen flex items-start justify-center px-6 py-16">
      <PageMeta
        title="About Holzen — Why we built a self-awareness tool for Bitcoin holders"
        description="Holzen applies behavioral finance research to help Bitcoin holders pause before acting on impulse. Built by a husband-and-wife team, small by design."
        path="/about"
      />
      <div className="w-full max-w-sm space-y-14">
        {/* Nav */}
        <motion.div {...m()}>
          <Link
            to="/welcome"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('common.back')}
          </Link>
        </motion.div>

        {/* Title */}
        <motion.div {...m(0.05)}>
          <PageHeading title={t('about.whyHolzenExists')} />
        </motion.div>

        {/* Section: The opportunity */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              {t('about.opportunityProblem')}
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {t('about.opportunityBody1')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.opportunityBody2')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.opportunityBody3')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.opportunityBody4')}
            </p>
          </div>
        </motion.div>

        {/* Section: Behavioral finance */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              {t('about.whatResearchSays')}
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {t('about.researchBody1')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.researchBody2')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.researchBody3')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.researchBody4')}
            </p>
          </div>
        </motion.div>

        {/* Section: The 5-step pause — summary */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              {t('about.pauseResearchTitle')}
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {t('about.pauseResearchIntro')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('landing.scienceStepsSummary')}
            </p>
            <Link
              to="/welcome#science"
              className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80"
            >
              {t('about.readFullScience')}
            </Link>
          </div>
        </motion.div>

        {/* Section: Why Bitcoin */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              {t('about.whyBitcoin')}
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {t('about.bitcoinBody1')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.bitcoinBody2')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.bitcoinBody3')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.bitcoinBody4')}
            </p>
          </div>
        </motion.div>

        {/* Section: Micropreneurship */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              {t('about.ourPhilosophy')}
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {t('about.philosophyBody1')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.philosophyBody2')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.philosophyBody3')}
            </p>
          </div>
        </motion.div>

        {/* Section: BTC Reserve */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              {t('about.btcReserve')}
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {t('about.reserveBody1')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.reserveBody2')}
            </p>
            <Link
              to="/reserve"
              className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80"
            >
              {t('about.readReserveStrategy')}
            </Link>
          </div>
        </motion.div>

        {/* Section: About us */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              {t('about.aboutUs')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.aboutUsBody1')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('about.aboutUsBody2')}
            </p>
          </div>
        </motion.div>

        <PublicFooter />
      </div>
    </div>
  );
};

export default About;
