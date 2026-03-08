import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import {
  ArrowRight, Twitter, Wind, Feather, BookOpen, TrendingDown, Brain, Tag,
  BarChart3, MessageCircle, Target, Heart, Mail, Globe, Shield, Award,
  Zap, Moon, ChevronDown, Timer, Eye, Sparkles,
} from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { HolzenNumber } from '@/components/HolzenNumber';
import { LandingTestimonials } from '@/components/LandingTestimonials';

function Section({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const prefersReduced = useReducedMotion();

  return (
    <motion.section
      ref={ref}
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : prefersReduced ? { opacity: 1 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground/60 mb-6">
      {children}
    </p>
  );
}

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) localStorage.setItem('holzen_ref', ref);
  }, [searchParams]);

  const LOOP_STEPS = [
    { num: '01', icon: <TrendingDown className="h-4 w-4" />, title: t('landing.steps.01title'), desc: t('landing.steps.01desc') },
    { num: '02', icon: <Wind className="h-4 w-4" />, title: t('landing.steps.02title'), desc: t('landing.steps.02desc') },
    { num: '03', icon: <Eye className="h-4 w-4" />, title: t('landing.steps.03title'), desc: t('landing.steps.03desc') },
    { num: '04', icon: <Target className="h-4 w-4" />, title: t('landing.steps.04title'), desc: t('landing.steps.04desc') },
    { num: '05', icon: <Sparkles className="h-4 w-4" />, title: t('landing.steps.05title'), desc: t('landing.steps.05desc') },
  ];

  const COMPANIONS = [
    { icon: <Wind className="h-4 w-4" />, label: t('landing.companions.breathing'), desc: t('landing.companions.breathingDesc') },
    { icon: <Feather className="h-4 w-4" />, label: t('landing.companions.haiku'), desc: t('landing.companions.haikuDesc') },
    { icon: <Zap className="h-4 w-4" />, label: t('landing.companions.signal'), desc: t('landing.companions.signalDesc') },
    { icon: <BookOpen className="h-4 w-4" />, label: t('landing.companions.learning'), desc: t('landing.companions.learningDesc') },
    { icon: <Globe className="h-4 w-4" />, label: t('landing.companions.zoomOut'), desc: t('landing.companions.zoomOutDesc') },
    { icon: <Timer className="h-4 w-4" />, label: t('landing.companions.history'), desc: t('landing.companions.historyDesc') },
  ];

  const FEATURES = [
    { icon: <TrendingDown />, label: t('landing.features.detection'), desc: t('landing.features.detectionDesc') },
    { icon: <Brain />, label: t('landing.features.mood'), desc: t('landing.features.moodDesc') },
    { icon: <Target />, label: t('landing.features.ritual'), desc: t('landing.features.ritualDesc') },
    { icon: <BarChart3 />, label: t('landing.features.insights'), desc: t('landing.features.insightsDesc') },
    { icon: <Heart />, label: t('landing.features.library'), desc: t('landing.features.libraryDesc') },
    { icon: <Mail />, label: t('landing.features.letters'), desc: t('landing.features.lettersDesc') },
    { icon: <Award />, label: t('landing.features.badges'), desc: t('landing.features.badgesDesc') },
    { icon: <Moon />, label: t('landing.features.night'), desc: t('landing.features.nightDesc') },
    { icon: <Tag />, label: t('landing.features.tags'), desc: t('landing.features.tagsDesc') },
    { icon: <MessageCircle />, label: t('landing.features.journal'), desc: t('landing.features.journalDesc') },
    { icon: <Globe />, label: t('landing.features.languages'), desc: t('landing.features.languagesDesc') },
    { icon: <Shield />, label: t('landing.features.privacy'), desc: t('landing.features.privacyDesc') },
  ];

  const FAQ = [
    { key: 'what', q: t('landing.faq.whatQuestion'), a: t('landing.faq.whatAnswer') },
    { key: 'advice', q: t('landing.faq.adviceQuestion'), a: t('landing.faq.adviceAnswer') },
    { key: 'companions', q: t('landing.faq.companionsQuestion'), a: t('landing.faq.companionsAnswer') },
    { key: 'ritual', q: t('landing.faq.ritualQuestion'), a: t('landing.faq.ritualAnswer') },
    { key: 'tracking', q: t('landing.faq.trackingQuestion'), a: t('landing.faq.trackingAnswer') },
    { key: 'data', q: t('landing.faq.dataQuestion'), a: t('landing.faq.dataAnswer') },
    { key: 'cancel', q: t('landing.faq.cancelQuestion'), a: t('landing.faq.cancelAnswer') },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta
        title="Holzen — Pause before you act on Bitcoin volatility"
        description="Holzen watches Bitcoin volatility and sends AI-generated reflections to help you pause before acting on impulse. Mood tracking, journaling, rituals, and behavioral insights."
        path="/welcome"
      />

      {/* ─── HERO ─── */}
      <div className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 70%)', filter: 'blur(100px)' }}
            animate={prefersReduced ? {} : { x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.03) 0%, transparent 70%)', filter: 'blur(80px)' }}
            animate={prefersReduced ? {} : { x: [0, -30, 20, 0], y: [0, 25, -15, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Nav */}
        <motion.nav
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-sm bg-background/80"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-xs font-mono tracking-[0.25em] uppercase text-foreground/80">Holzen</h1>
          <button
            onClick={() => navigate('/auth')}
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('common.signIn')}
          </button>
        </motion.nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-lg text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Breathing dot */}
            <motion.div
              className="mx-auto w-3 h-3 rounded-full bg-primary/20"
              animate={prefersReduced ? {} : { scale: [1, 1.8, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            <h2 className="text-2xl sm:text-3xl leading-tight tracking-tight text-foreground">
              {t('landing.hero')}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
              {t('landing.heroDesc')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="font-mono text-xs tracking-wider group px-8"
            >
              {t('landing.getStartedFree')}
              <ArrowRight className="h-3.5 w-3.5 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground/30 animate-bounce" />
        </motion.div>
      </div>

      {/* ─── HOLZEN NUMBER ─── */}
      <div className="max-w-lg mx-auto px-6 py-16">
        <Section>
          <HolzenNumber />
        </Section>
      </div>

      {/* ─── THE LOOP ─── */}
      <div className="max-w-lg mx-auto px-6 py-16">
        <Section>
          <SectionLabel>{t('landing.reflectionLoop')}</SectionLabel>
          <div className="space-y-0">
            {LOOP_STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                className="relative flex gap-5 pb-8 last:pb-0"
                initial={prefersReduced ? {} : { opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                {/* Vertical line */}
                {i < LOOP_STEPS.length - 1 && (
                  <div className="absolute left-[15px] top-[36px] bottom-0 w-px bg-border/40" />
                )}
                {/* Icon circle */}
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full border border-border/60 bg-background flex items-center justify-center text-muted-foreground/60">
                  {step.icon}
                </div>
                <div className="space-y-1 pt-1">
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      </div>

      {/* ─── COMPANIONS ─── */}
      <div className="bg-muted/30">
        <div className="max-w-lg mx-auto px-6 py-16">
          <Section>
            <SectionLabel>{t('landing.companionsTitle')}</SectionLabel>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {t('landing.companionsDesc')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {COMPANIONS.map((c, i) => (
                <motion.div
                  key={c.label}
                  className="rounded-lg border border-border/40 bg-background/60 p-4 space-y-2 hover:border-border/70 transition-colors"
                  initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/70">
                    {c.icon}
                  </div>
                  <p className="text-xs font-medium text-foreground">{c.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{c.desc}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* ─── SCIENCE ─── */}
      <div className="max-w-lg mx-auto px-6 py-16">
        <Section>
          <div className="relative pl-5 border-l-2 border-primary/20 space-y-4">
            <p className="text-base text-foreground leading-relaxed italic">
              {t('landing.scienceQuote')}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('landing.scienceDesc')}
            </p>
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
              Kahneman, D. (2011). <em>Thinking, Fast and Slow</em>. · Barber, B. & Odean, T. (2000). "Trading Is Hazardous to Your Wealth."
            </p>
          </div>
        </Section>
      </div>

      {/* ─── FEATURES ─── */}
      <div className="bg-muted/30">
        <div className="max-w-lg mx-auto px-6 py-16">
          <Section>
            <SectionLabel>{t('landing.whatYouGet')}</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.label}
                  className="rounded-lg border border-border/40 bg-background/60 p-3.5 space-y-1.5 hover:border-border/70 transition-colors"
                  initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                >
                  <div className="text-muted-foreground/60 [&>svg]:h-3.5 [&>svg]:w-3.5">{f.icon}</div>
                  <p className="text-xs font-medium text-foreground">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* ─── PRICING CTA ─── */}
      <div className="max-w-lg mx-auto px-6 py-16">
        <Section>
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-xl font-mono text-foreground">{t('landing.freeToStart')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                {t('landing.pricingDesc')}
              </p>
            </div>
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="font-mono text-xs tracking-wider group px-10"
            >
              {t('landing.getStartedFree')}
              <ArrowRight className="h-3.5 w-3.5 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </Section>
      </div>

      {/* ─── TESTIMONIALS ─── */}
      <div className="max-w-lg mx-auto px-6 pb-16">
        <Section>
          <LandingTestimonials />
        </Section>
      </div>

      {/* ─── FAQ ─── */}
      <div className="bg-muted/30">
        <div className="max-w-lg mx-auto px-6 py-16">
          <Section>
            <SectionLabel>{t('landing.questions')}</SectionLabel>
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((item) => (
                <AccordionItem key={item.key} value={item.key} className="border-border/40">
                  <AccordionTrigger className="text-sm text-foreground hover:no-underline py-4 text-left">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4">
                    {item.a}
                    {item.key === 'data' && (
                      <>
                        {' '}
                        <Link to="/privacy" className="underline hover:text-foreground transition-colors">
                          {t('landing.privacy')}
                        </Link>.
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Section>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="max-w-lg mx-auto px-6 py-16 space-y-8">
        <Section>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('landing.footer')}
          </p>

          <div className="flex items-center gap-4 mt-6">
            <a href="https://x.com/holzenapp" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" aria-label="Follow on X">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="https://njump.me/holzen" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" aria-label="Follow on Nostr">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5v-3.07c-1.42-.17-2.7-.8-3.64-1.74l1.42-1.42A4.47 4.47 0 0012 12.5c1.38 0 2.63-.56 3.54-1.46l1.42 1.42A6.47 6.47 0 0113 14.43V17.5h-2z" />
              </svg>
            </a>
          </div>

          <div className="mt-6 space-y-1">
            <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground/50">{t('landing.contact')}</p>
            <a href="mailto:hello@holzen.app" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              hello@holzen.app
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/60 mt-6">
            <Link to="/about" className="hover:text-foreground transition-colors">{t('landing.about')}</Link>
            <span className="text-muted-foreground/20">·</span>
            <Link to="/reserve" className="hover:text-foreground transition-colors">{t('landing.btcReserve')}</Link>
            <span className="text-muted-foreground/20">·</span>
            <Link to="/blog" className="hover:text-foreground transition-colors">{t('landing.blog')}</Link>
            <span className="text-muted-foreground/20">·</span>
            <Link to="/roadmap" className="hover:text-foreground transition-colors">{t('landing.roadmap')}</Link>
            <span className="text-muted-foreground/20">·</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">{t('landing.terms')}</Link>
            <span className="text-muted-foreground/20">·</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">{t('landing.privacy')}</Link>
          </div>
        </Section>
      </footer>
    </div>
  );
};

export default Landing;
