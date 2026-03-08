import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, Twitter, Wind, Feather, BookOpen, TrendingDown, Brain, Tag,
  BarChart3, MessageCircle, Target, Heart, Mail, Globe, Shield, Award,
  Zap, Library, Moon, Sparkles,
} from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { HolzenNumber } from '@/components/HolzenNumber';
import { LandingTestimonials } from '@/components/LandingTestimonials';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
});

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem('holzen_ref', ref);
    }
  }, [searchParams]);

  const m = (delay = 0) => (prefersReduced ? {} : fade(delay));

  const COMPANIONS = [
    { icon: <Wind className="h-3.5 w-3.5" />, label: t('landing.companions.breathing'), desc: t('landing.companions.breathingDesc') },
    { icon: <Feather className="h-3.5 w-3.5" />, label: t('landing.companions.haiku'), desc: t('landing.companions.haikuDesc') },
    { icon: <Zap className="h-3.5 w-3.5" />, label: t('landing.companions.signal'), desc: t('landing.companions.signalDesc') },
    { icon: <BookOpen className="h-3.5 w-3.5" />, label: t('landing.companions.learning'), desc: t('landing.companions.learningDesc') },
    { icon: <Globe className="h-3.5 w-3.5" />, label: t('landing.companions.zoomOut'), desc: t('landing.companions.zoomOutDesc') },
    { icon: <BookOpen className="h-3.5 w-3.5" />, label: t('landing.companions.history'), desc: t('landing.companions.historyDesc') },
  ];

  const FEATURES = [
    { icon: <TrendingDown className="h-3.5 w-3.5" />, label: t('landing.features.detection'), desc: t('landing.features.detectionDesc') },
    { icon: <Brain className="h-3.5 w-3.5" />, label: t('landing.features.mood'), desc: t('landing.features.moodDesc') },
    { icon: <Tag className="h-3.5 w-3.5" />, label: t('landing.features.tags'), desc: t('landing.features.tagsDesc') },
    { icon: <MessageCircle className="h-3.5 w-3.5" />, label: t('landing.features.journal'), desc: t('landing.features.journalDesc') },
    { icon: <Target className="h-3.5 w-3.5" />, label: t('landing.features.ritual'), desc: t('landing.features.ritualDesc') },
    { icon: <BarChart3 className="h-3.5 w-3.5" />, label: t('landing.features.insights'), desc: t('landing.features.insightsDesc') },
    { icon: <Mail className="h-3.5 w-3.5" />, label: t('landing.features.letters'), desc: t('landing.features.lettersDesc') },
    { icon: <Heart className="h-3.5 w-3.5" />, label: t('landing.features.library'), desc: t('landing.features.libraryDesc') },
    { icon: <Award className="h-3.5 w-3.5" />, label: t('landing.features.badges'), desc: t('landing.features.badgesDesc') },
    { icon: <Moon className="h-3.5 w-3.5" />, label: t('landing.features.night'), desc: t('landing.features.nightDesc') },
    { icon: <Globe className="h-3.5 w-3.5" />, label: t('landing.features.languages'), desc: t('landing.features.languagesDesc') },
    { icon: <Shield className="h-3.5 w-3.5" />, label: t('landing.features.privacy'), desc: t('landing.features.privacyDesc') },
  ];

  return (
    <div className="min-h-screen flex items-start justify-center px-6 py-16">
      <PageMeta
        title="Holzen — Pause before you act on Bitcoin volatility"
        description="Holzen watches Bitcoin volatility and sends AI-generated reflections to help you pause before acting on impulse. Mood tracking, journaling, rituals, and behavioral insights — not trading advice."
        path="/welcome"
      />
      <div className="w-full max-w-sm space-y-14">
        {/* Header */}
        <motion.div {...m()} className="flex items-center justify-between">
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
            Holzen
          </h1>
          <button
            onClick={() => navigate('/auth')}
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('common.signIn')}
          </button>
        </motion.div>

        {/* Hero */}
        <motion.div {...m(0.1)}>
          <div className="space-y-5">
            <p className="text-xl leading-relaxed text-foreground">
              {t('landing.hero')}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('landing.heroDesc')}
            </p>
          </div>
        </motion.div>

        {/* The Holzen Number */}
        <motion.div {...m(0.15)}>
          <HolzenNumber />
        </motion.div>

        {/* The loop */}
        <div className="space-y-5">
          <motion.p
            className="text-xs font-mono tracking-widest uppercase text-muted-foreground"
            {...m()}
          >
            {t('landing.reflectionLoop')}
          </motion.p>
          <div className="space-y-4">
            {[
              { step: '01', title: t('landing.steps.01title'), desc: t('landing.steps.01desc') },
              { step: '02', title: t('landing.steps.02title'), desc: t('landing.steps.02desc') },
              { step: '03', title: t('landing.steps.03title'), desc: t('landing.steps.03desc') },
              { step: '04', title: t('landing.steps.04title'), desc: t('landing.steps.04desc') },
              { step: '05', title: t('landing.steps.05title'), desc: t('landing.steps.05desc') },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                className="flex gap-4"
                {...(prefersReduced ? {} : {
                  initial: { opacity: 0, x: -10 },
                  whileInView: { opacity: 1, x: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.5, delay: i * 0.08 },
                })}
              >
                <span className="text-[10px] font-mono text-muted-foreground/40 pt-1 shrink-0">{step.step}</span>
                <div className="space-y-1">
                  <p className="text-sm text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Companions */}
        <div className="space-y-5">
          <motion.p
            className="text-xs font-mono tracking-widest uppercase text-muted-foreground"
            {...m()}
          >
            {t('landing.companionsTitle')}
          </motion.p>
          <motion.p className="text-sm text-muted-foreground leading-relaxed" {...m(0.05)}>
            {t('landing.companionsDesc')}
          </motion.p>
          <div className="grid grid-cols-2 gap-3">
            {COMPANIONS.map((c, i) => (
              <motion.div
                key={c.label}
                className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1.5"
                {...(prefersReduced ? {} : {
                  initial: { opacity: 0, y: 8 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.4, delay: i * 0.05 },
                })}
              >
                <div className="text-muted-foreground">{c.icon}</div>
                <p className="text-xs text-foreground leading-snug">{c.label}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Features grid */}
        <div className="space-y-5">
          <motion.p
            className="text-xs font-mono tracking-widest uppercase text-muted-foreground"
            {...m()}
          >
            {t('landing.whatYouGet')}
          </motion.p>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1.5"
                {...(prefersReduced ? {} : {
                  initial: { opacity: 0, y: 8 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.4, delay: i * 0.04 },
                })}
              >
                <div className="text-muted-foreground">{f.icon}</div>
                <p className="text-xs text-foreground leading-snug">{f.label}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* The science */}
        <motion.div {...m()}>
          <div className="space-y-3 border-l-2 border-primary/30 pl-4">
            <p className="text-sm text-foreground leading-relaxed">
              {t('landing.scienceQuote')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('landing.scienceDesc')}
            </p>
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed italic">
              Kahneman, D. (2011). <em>Thinking, Fast and Slow</em>. · Barber, B. & Odean, T. (2000). "Trading Is Hazardous to Your Wealth." <em>The Journal of Finance</em>.
            </p>
          </div>
        </motion.div>

        {/* Pricing + CTA */}
        <motion.div {...m()}>
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="space-y-1">
              <p className="text-lg font-mono text-foreground">{t('landing.freeToStart')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('landing.pricingDesc')}
              </p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => navigate('/auth')}
                className="w-full font-mono text-xs group"
              >
                {t('landing.getStartedFree')}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                {t('landing.clarityWorth')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div {...m()}>
          <LandingTestimonials />
        </motion.div>

        {/* FAQ */}
        <motion.div {...m()}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              {t('landing.questions')}
            </p>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what" className="border-border">
                <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                  {t('landing.faq.whatQuestion')}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  {t('landing.faq.whatAnswer')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="advice" className="border-border">
                <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                  {t('landing.faq.adviceQuestion')}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  {t('landing.faq.adviceAnswer')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="companions" className="border-border">
                <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                  {t('landing.faq.companionsQuestion')}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  {t('landing.faq.companionsAnswer')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ritual" className="border-border">
                <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                  {t('landing.faq.ritualQuestion')}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  {t('landing.faq.ritualAnswer')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tracking" className="border-border">
                <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                  {t('landing.faq.trackingQuestion')}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  {t('landing.faq.trackingAnswer')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="data" className="border-border">
                <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                  {t('landing.faq.dataQuestion')}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  {t('landing.faq.dataAnswer')}{' '}
                  <Link to="/privacy" className="underline hover:text-foreground transition-colors">
                    {t('landing.privacy')}
                  </Link>.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="cancel" className="border-border">
                <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                  {t('landing.faq.cancelQuestion')}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  {t('landing.faq.cancelAnswer')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div {...m()}>
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('landing.footer')}
            </p>

            {/* Social */}
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/holzenapp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Follow on X"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://njump.me/holzen"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Follow on Nostr"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5v-3.07c-1.42-.17-2.7-.8-3.64-1.74l1.42-1.42A4.47 4.47 0 0012 12.5c1.38 0 2.63-.56 3.54-1.46l1.42 1.42A6.47 6.47 0 0113 14.43V17.5h-2z" />
                </svg>
              </a>
            </div>

            {/* Contact */}
            <div className="space-y-1">
              <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/70">
                {t('landing.contact')}
              </p>
              <a
                href="mailto:hello@holzen.app"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                hello@holzen.app
              </a>
            </div>

            {/* Legal */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Link to="/about" className="hover:text-foreground transition-colors">{t('landing.about')}</Link>
              <span>·</span>
              <Link to="/reserve" className="hover:text-foreground transition-colors">{t('landing.btcReserve')}</Link>
              <span>·</span>
              <Link to="/blog" className="hover:text-foreground transition-colors">{t('landing.blog')}</Link>
              <span>·</span>
              <Link to="/roadmap" className="hover:text-foreground transition-colors">{t('landing.roadmap')}</Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-foreground transition-colors">{t('landing.terms')}</Link>
              <span>·</span>
              <Link to="/privacy" className="hover:text-foreground transition-colors">{t('landing.privacy')}</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
