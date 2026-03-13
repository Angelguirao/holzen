import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Wind, Heart, BookOpen, RefreshCw, Target, ExternalLink } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { PublicFooter } from '@/components/PublicFooter';

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
          <h1 className="text-xl text-foreground leading-relaxed">
            {t('about.whyHolzenExists')}
          </h1>
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

        {/* Section: The 5-step pause */}
        <motion.div {...m(0.1)}>
          <div className="space-y-5">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              {t('about.pauseResearchTitle')}
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {t('about.pauseResearchIntro')}
            </p>
            {([
              { key: 'Breathe', icon: Wind, sources: [
                { label: 'Porges (2011). The Polyvagal Theory', url: 'https://wwnorton.com/books/9780393707007' },
                { label: 'Lehrer & Gevirtz (2014). HRV biofeedback', url: 'https://doi.org/10.3389/fpsyg.2014.00756' },
              ]},
              { key: 'Feel', icon: Heart, sources: [
                { label: 'Lieberman et al. (2007). Affect labeling', url: 'https://doi.org/10.1111/j.1467-9280.2007.01916.x' },
              ]},
              { key: 'Reflect', icon: BookOpen, sources: [
                { label: 'Gross (2002). Emotion regulation', url: 'https://www.guilford.com/books/Handbook-of-Emotions/Lewis-Haviland-Jones-Barrett/9781462536368' },
                { label: 'Gross (1998). Integrative review', url: 'https://doi.org/10.1037/1089-2680.2.3.271' },
              ]},
              { key: 'Shift', icon: RefreshCw, sources: [
                { label: 'Flavell (1979). Metacognition', url: 'https://www.researchgate.net/publication/232599909_Metacognition_and_cognitive_monitoring_A_new_area_of_cognitive-developmental_inquiry' },
              ]},
              { key: 'Decide', icon: Target, sources: [
                { label: 'Kahneman (2011). Thinking, Fast and Slow', url: 'https://us.macmillan.com/books/9780374533557/thinkingfastandslow' },
                { label: 'Kahneman & Tversky (1974). Heuristics and biases', url: 'https://doi.org/10.1126/science.185.4157.1124' },
              ]},
            ] as const).map(({ key, icon: Icon, sources }) => (
              <div key={key} className="flex gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
                  <Icon className="h-3 w-3 text-muted-foreground/60" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">
                    {t(`about.pauseResearch${key}`)}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t(`about.pauseResearch${key}Desc`)}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {sources.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] font-mono text-primary/60 hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
              className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:text-primary/80 transition-colors"
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
