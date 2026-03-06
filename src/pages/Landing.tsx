import { useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion, useReducedMotion } from 'framer-motion';
import { Shield, Clock, BellOff, ArrowRight } from 'lucide-react';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
});

const Landing = () => {
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

  return (
    <div className="min-h-screen flex items-start justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-12">
        {/* Header */}
        <motion.div {...m()} className="flex items-center justify-between">
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
            Holzen
          </h1>
          <button
            onClick={() => navigate('/auth')}
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </button>
        </motion.div>

        {/* Hero */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xl leading-relaxed text-foreground">
              When Bitcoin moves, pause before you do.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Holzen watches volatility so you don't have to. When the market crosses your threshold, you receive one quiet reflection — not advice, not urgency — just a moment to consider your intentions.
            </p>
          </div>
        </motion.div>

        {/* The science — the "why" */}
        <motion.div {...m(0.15)}>
          <div className="space-y-3 border-l-2 border-primary/30 pl-4">
            <p className="text-sm text-foreground leading-relaxed">
              Impulsive decisions under volatility consistently lead to worse outcomes.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Behavioral finance research shows that emotional reactions — panic selling during drops, euphoric buying during surges — are among the most reliable predictors of poor returns. Nobel laureate Daniel Kahneman's work on fast vs. slow thinking explains why: under stress, your instinctive mind takes over before your reflective mind has a chance to weigh in.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Holzen creates that missing pause — a small intervention between impulse and decision.
            </p>
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed italic">
              Kahneman, D. (2011). <em>Thinking, Fast and Slow</em>. Farrar, Straus and Giroux. · Barber, B. & Odean, T. (2000). "Trading Is Hazardous to Your Wealth." <em>The Journal of Finance</em>, 55(2).
            </p>
          </div>
        </motion.div>

        {/* How it works */}
        <div className="space-y-5">
          <motion.p
            className="text-xs font-mono tracking-widest uppercase text-muted-foreground"
            {...m()}
          >
            How it works
          </motion.p>
          <div className="space-y-4">
            {[
              {
                icon: <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />,
                title: 'Set your threshold',
                desc: 'Choose the percentage of 24h volatility that matters to you.',
              },
              {
                icon: <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />,
                title: 'Receive a reflection',
                desc: 'When volatility crosses your line, an AI-generated message encourages pause — never action.',
              },
              {
                icon: <BellOff className="h-4 w-4 text-primary shrink-0 mt-0.5" />,
                title: 'Nothing more',
                desc: 'No charts, no alerts, no trading signals. One message, then silence for six hours.',
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                className="flex gap-3"
                {...(prefersReduced ? {} : {
                  initial: { opacity: 0, x: -10 },
                  whileInView: { opacity: 1, x: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.5, delay: i * 0.1 },
                })}
              >
                {step.icon}
                <div className="space-y-1">
                  <p className="text-sm text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pricing + CTA */}
        <motion.div {...m()}>
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="space-y-1">
              <p className="text-lg font-mono text-foreground">Free to start</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your first 3 reflections are free — no card required. Then $3/month for unlimited AI reflections via push, email, or in-app. Cancel anytime.
              </p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => navigate('/auth')}
                className="w-full font-mono text-xs group"
              >
                Get started free
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                How much is one moment of clarity worth?
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div {...m()}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              Questions
            </p>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what" className="border-border">
                <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                  What exactly does Holzen do?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  Holzen monitors Bitcoin's 24-hour price movement. When volatility crosses your chosen threshold, it sends you a single AI-generated reflection designed to encourage pause — not action. Then it goes quiet for six hours.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="science" className="border-border">
                <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                  Is there science behind this?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  Yes. Decades of behavioral finance research — from Kahneman's Nobel-winning work on cognitive biases to Barber &amp; Odean's studies showing that frequent traders underperform by 6.5% annually — demonstrate that emotional, impulsive decisions under volatility are among the most costly mistakes investors make. Holzen applies a simple, evidence-based idea: a brief pause before action leads to better decisions.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="advice" className="border-border">
                <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                  Will it tell me what to buy or sell?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  Never. Holzen is not a trading tool or financial advisor. Reflections are intentionally neutral — they exist only to create a moment of awareness before you act on impulse.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="data" className="border-border">
                <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                  What data do you collect?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  Only what's needed to run the service: your email, your volatility threshold, and push tokens if enabled. We don't track, profile, or sell your data. See our <Link to="/privacy" className="underline hover:text-foreground transition-colors">privacy policy</Link> for details.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="cancel" className="border-border">
                <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                  Can I cancel anytime?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  Yes. Cancel through the app whenever you like — you keep access until the end of your billing period. No contracts, no commitments.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div {...m()}>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Holzen is not a trading tool. It won't tell you what to do. It exists to create a small space between impulse and decision.
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <span>·</span>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <span>·</span>
              <a href="mailto:hello@holzen.app" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
