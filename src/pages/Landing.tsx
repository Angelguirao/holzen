import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { LandingComparison } from '@/components/LandingComparison';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import {
  ArrowRight, Twitter, Instagram, Wind, Feather, BookOpen, TrendingDown, Brain,
  BarChart3, Target, Heart, Mail, Globe, Shield, Award,
  Zap, Moon, ChevronDown, Timer, Eye, Sparkles, RefreshCw,
  Smartphone, Anchor, ExternalLink, UserCircle,
} from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { LandingTestimonials } from '@/components/LandingTestimonials';
import { LandingLanguageSwitcher } from '@/components/LandingLanguageSwitcher';
import { PRICING } from '@/lib/pricing';

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
    <p className="tracking-[0.2em] uppercase text-muted-foreground/60 mb-6 text-sm font-sans">
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



  const COMPANIONS = [
    { icon: <Feather className="h-4 w-4" />, label: t('landing.companions.haiku'), desc: t('landing.companions.haikuDesc') },
    { icon: <Zap className="h-4 w-4" />, label: t('landing.companions.signal'), desc: t('landing.companions.signalDesc') },
    { icon: <BookOpen className="h-4 w-4" />, label: t('landing.companions.grounding'), desc: t('landing.companions.groundingDesc') },
    { icon: <Globe className="h-4 w-4" />, label: t('landing.companions.zoomOut'), desc: t('landing.companions.zoomOutDesc') },
    { icon: <Timer className="h-4 w-4" />, label: t('landing.companions.history'), desc: t('landing.companions.historyDesc') },
  ];

  /** What's included on the landing page — trimmed for clarity; product still includes more (see app). */
  const FEATURES = [
    { icon: <Wind />, label: t('landing.features.pause'), desc: t('landing.features.pauseDesc') },
    { icon: <Sparkles />, label: t('landing.features.companions'), desc: t('landing.features.companionsDesc') },
    { icon: <TrendingDown />, label: t('landing.features.detection'), desc: t('landing.features.detectionDesc') },
    { icon: <Brain />, label: t('landing.features.mood'), desc: t('landing.features.moodDesc') },
    { icon: <Anchor />, label: t('landing.features.grounding'), desc: t('landing.features.groundingDesc') },
    { icon: <BarChart3 />, label: t('landing.features.insights'), desc: t('landing.features.insightsDesc') },
    { icon: <Eye />, label: t('landing.features.holdGoals'), desc: t('landing.features.holdGoalsDesc') },
    { icon: <UserCircle />, label: t('landing.features.profileStats'), desc: t('landing.features.profileStatsDesc') },
    { icon: <Award />, label: t('landing.features.badges'), desc: t('landing.features.badgesDesc') },
    { icon: <Heart />, label: t('landing.features.library'), desc: t('landing.features.libraryDesc') },
    { icon: <Mail />, label: t('landing.features.letters'), desc: t('landing.features.lettersDesc') },
    { icon: <Target />, label: t('landing.features.practice'), desc: t('landing.features.practiceDesc') },
    { icon: <Feather />, label: t('landing.features.mantra'), desc: t('landing.features.mantraDesc') },
    { icon: <Moon />, label: t('landing.features.mindfulSpaces'), desc: t('landing.features.mindfulSpacesDesc') },
    { icon: <Smartphone />, label: t('landing.features.pwa'), desc: t('landing.features.pwaDesc') },
    { icon: <Shield />, label: t('landing.features.privacy'), desc: t('landing.features.privacyDesc') },
  ];

  const FAQ = [
    { key: 'who', q: t('landing.faq.whoQuestion'), a: t('landing.faq.whoAnswer') },
    { key: 'breathe', q: t('landing.faq.breatheQuestion'), a: t('landing.faq.breatheAnswer') },
    { key: 'meditation', q: t('landing.faq.meditationQuestion'), a: t('landing.faq.meditationAnswer') },
    { key: 'value', q: t('landing.faq.valueQuestion', { price: PRICING.monthlyPrice.toFixed(2) }), a: t('landing.faq.valueAnswer', { freeReflectionsPerMonth: PRICING.freeReflectionsPerMonth }) },
    { key: 'fairUse', q: t('landing.faq.fairUseQuestion'), a: t('landing.faq.fairUseAnswer') },
    { key: 'works', q: t('landing.faq.worksQuestion'), a: t('landing.faq.worksAnswer') },
    { key: 'rational', q: t('landing.faq.rationalQuestion'), a: t('landing.faq.rationalAnswer') },
    { key: 'data', q: t('landing.faq.dataQuestion'), a: t('landing.faq.dataAnswer') },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-foreground">
      <PageMeta
        title="Holzen — When Bitcoin moves, pause before you do"
        description="Holzen watches Bitcoin volatility and sends AI pause prompts to help you slow down before acting on impulse. Mood tracking, journaling, and behavioral insights."
        path="/welcome"
      />

      {/* ─── HERO ─── */}
      <div className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 overflow-hidden">

        {/* Nav */}
        <motion.nav
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-sm bg-background/80"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-base font-mono tracking-[0.25em] uppercase" style={{ color: '#DBB366' }}>Holzen</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/auth')}
              className="transition-colors font-sans text-base text-nox-text-link hover:text-nox-text-link/80"
            >
              {t('common.signIn')}
            </button>
          </div>
        </motion.nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-lg text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
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
              onClick={() => navigate('/auth?view=sign-up')}
              size="lg"
              className="font-sans text-base tracking-wider group px-8 font-medium"
            >
              {t('landing.getStartedForFree')}
            </Button>
            <p className="font-sans text-muted-foreground text-sm mt-[32px]">
              {t('landing.noCreditCard')}
            </p>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.button
          className="absolute bottom-8 cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          onClick={() => document.getElementById('reflection-loop')?.scrollIntoView({ behavior: 'smooth' })}
          aria-label="Scroll to content"
        >
          <ChevronDown className="h-4 w-4 animate-bounce text-muted-foreground" />
        </motion.button>
      </div>

      {/* ─── REACTION vs REFLECTION ─── */}
      <div id="reflection-loop" className="max-w-lg mx-auto px-6 py-16">
        <Section>
          <SectionLabel>{t('landing.reflectionLoop')}</SectionLabel>
          <LandingComparison variant="side-by-side" />
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
            <div className="flex flex-col gap-3">
              {COMPANIONS.map((c, i) => (
                <motion.div
                  key={c.label}
                  className="rounded-lg border border-border/40 bg-background/60 p-4 space-y-2 hover:border-border/70 transition-colors"
                  initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <p className="font-medium text-foreground text-base font-sans">{c.label}</p>
                  <p className="leading-relaxed text-sm font-sans text-muted-foreground">{c.desc}</p>
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
              <a href="https://doi.org/10.1111/0022-1082.00226" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground transition-colors">Barber, B. & Odean, T. (2000). "Trading Is Hazardous to Your Wealth." <em>The Journal of Finance</em>, 55(2).</a>
            </p>
          </div>
        </Section>
      </div>

      {/* ─── FIVE-STEP SCIENCE ─── */}
      <div className="bg-muted/30">
        <div className="max-w-lg mx-auto px-6 py-16">
          <Section>
            <SectionLabel>{t('landing.scienceStepsTitle')}</SectionLabel>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {t('landing.scienceStepsIntro')}
            </p>
            <div className="space-y-3">
              {([
                { key: 'Breathe', icon: Wind, step: 1, sources: [
                  { label: 'Porges (2011). The Polyvagal Theory', url: 'https://wwnorton.com/books/9780393707007' },
                  { label: 'Lehrer & Gevirtz (2014). HRV biofeedback', url: 'https://doi.org/10.3389/fpsyg.2014.00756' },
                ]},
                { key: 'Feel', icon: Heart, step: 2, sources: [
                  { label: 'Lieberman et al. (2007). Affect labeling', url: 'https://doi.org/10.1111/j.1467-9280.2007.01916.x' },
                ]},
                { key: 'Reflect', icon: BookOpen, step: 3, sources: [
                  { label: 'Gross (2002). Emotion regulation', url: 'https://www.guilford.com/books/Handbook-of-Emotions/Lewis-Haviland-Jones-Barrett/9781462536368' },
                  { label: 'Gross (1998). Integrative review', url: 'https://doi.org/10.1037/1089-2680.2.3.271' },
                ]},
                { key: 'Shift', icon: RefreshCw, step: 4, sources: [
                  { label: 'Flavell (1979). Metacognition', url: 'https://www.researchgate.net/publication/232599909' },
                ]},
                { key: 'Decide', icon: Target, step: 5, sources: [
                  { label: 'Kahneman (2011). Thinking, Fast and Slow', url: 'https://us.macmillan.com/books/9780374533557/thinkingfastandslow' },
                  { label: 'Kahneman & Tversky (1974). Heuristics and biases', url: 'https://doi.org/10.1126/science.185.4157.1124' },
                ]},
              ] as const).map(({ key, icon: Icon, step, sources }) => (
                <div key={key} className="rounded-lg border border-border/40 bg-background/60 p-4 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground/40">{step}</span>
                      <p className="font-medium text-foreground text-base font-sans">{key}</p>
                    </div>
                  </div>
                  <p className="leading-relaxed pl-[38px] text-sm font-sans text-secondary-foreground">
                    {t(`landing.scienceStep${key}`)}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 pl-[38px]">
                    {sources.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-start gap-1 transition-colors text-sm font-sans text-muted-foreground"
                      >
                        <ExternalLink className="h-2.5 w-2.5 shrink-0 mt-[0.4em]" />
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* ─── FEATURES ─── */}
      <div className="bg-muted/30">
        <div className="max-w-lg mx-auto px-6 py-16">
          <Section>
            <SectionLabel>{t('landing.whatYouGet')}</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.label}
                  className="rounded-lg border border-border/40 bg-background/60 p-3.5 space-y-1.5 hover:border-border/70 transition-colors"
                  initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                >
                  <div className="[&>svg]:h-3.5 [&>svg]:w-3.5" style={{ color: '#C1CBD7' }}>{f.icon}</div>
                  <p className="font-medium text-foreground text-base font-sans">{f.label}</p>
                  <p className="text-muted-foreground leading-relaxed text-sm font-sans">{f.desc}</p>
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
              <p className="text-xl font-sans text-[#dbb266]">{t('landing.freeToStart')}</p>
              <p className="leading-relaxed max-w-sm mx-auto text-sm font-sans text-secondary-foreground">
                {t('landing.pricingDesc')}
              </p>
            </div>
            <Button
              onClick={() => navigate('/auth?view=sign-up')}
              size="lg"
              className="font-sans text-base tracking-wider group px-10"
            >
              {t('landing.getStartedForFree')}
            </Button>
          </div>
        </Section>
      </div>

      {/* ─── FAQ ─── */}
      <div className="bg-muted/30">
        <div className="max-w-lg mx-auto px-6 py-16">
          <Section>
            <SectionLabel>{t('landing.questions')}</SectionLabel>
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((item) => (
                <AccordionItem key={item.key} value={item.key} className="border-border/40 [&:first-child_button]:pt-0">
                  <AccordionTrigger className="text-sm text-foreground hover:no-underline py-4 text-left">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="whitespace-pre-line text-xs text-muted-foreground leading-relaxed pb-4">
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
            <a href="https://instagram.com/holzenapp" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" aria-label="Follow on Instagram">
              <Instagram className="h-4 w-4" />
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
