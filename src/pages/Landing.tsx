import { useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion, useReducedMotion } from 'framer-motion';
import { Shield, Clock, BellOff } from 'lucide-react';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
});

const stagger = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
};

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

  const motionProps = (delay = 0) => (prefersReduced ? {} : fade(delay));

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-10">
        {/* Header */}
        <motion.div {...motionProps()}>
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
            Holzen
          </h1>
        </motion.div>

        {/* Hero */}
        <motion.div {...motionProps(0.1)}>
          <div className="space-y-4">
            <p className="text-xl leading-relaxed text-foreground">
              When Bitcoin moves, pause before you do.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Holzen watches volatility so you don't have to. When the market crosses your threshold, you receive one quiet reflection — not advice, not urgency — just a moment to consider your intentions.
            </p>
          </div>
        </motion.div>

        <motion.div {...motionProps(0.15)}>
          <Separator />
        </motion.div>

        {/* Social proof stats */}
        <motion.div {...motionProps(0.2)}>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: '2,400+', label: 'Pauses taken' },
              { value: '6h', label: 'Quiet between' },
              { value: '0', label: 'Trades suggested' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="space-y-1"
                {...(prefersReduced ? {} : {
                  initial: { opacity: 0, scale: 0.95 },
                  whileInView: { opacity: 1, scale: 1 },
                  viewport: { once: true },
                  transition: { duration: 0.5, delay: 0.25 + i * 0.08 },
                })}
              >
                <p className="text-lg font-mono text-foreground">{stat.value}</p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div {...motionProps(0.2)}>
          <Separator />
        </motion.div>

        {/* How it works */}
        <div className="space-y-4">
          <motion.p
            className="text-xs font-mono tracking-widest uppercase text-muted-foreground"
            {...motionProps()}
          >
            How it works
          </motion.p>
          <div className="space-y-4">
            {[
              {
                icon: <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />,
                title: 'Set your threshold',
                desc: 'Choose the percentage of 24h volatility that matters to you.',
              },
              {
                icon: <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />,
                title: 'Receive a reflection',
                desc: 'When volatility crosses your line, an AI-generated message encourages pause — never action.',
              },
              {
                icon: <BellOff className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />,
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

        <motion.div {...motionProps()}>
          <Separator />
        </motion.div>

        {/* Testimonial */}
        <motion.div {...motionProps()}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              From the community
            </p>
            <div className="space-y-5">
              {[
                {
                  quote: '"I used to check charts every hour. Now I just wait for the reflection and decide if I need to act at all."',
                  author: '— M., long-term holder',
                },
                {
                  quote: '"It\'s not about ignoring the market. It\'s about not letting the market control you."',
                  author: '— R., DCA investor',
                },
              ].map((t, i) => (
                <motion.blockquote
                  key={i}
                  className="border-l-2 border-border pl-4 space-y-2"
                  {...(prefersReduced ? {} : {
                    initial: { opacity: 0, x: -6 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.6, delay: i * 0.12 },
                  })}
                >
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    {t.quote}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground/70">{t.author}</p>
                </motion.blockquote>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div {...motionProps()}>
          <Separator />
        </motion.div>

        {/* Pricing */}
        <motion.div {...motionProps()}>
          <div className="space-y-2">
            <p className="text-sm text-foreground">$3/month</p>
            <p className="text-xs text-muted-foreground">
              AI reflections via push, email, or in-app. Cancel anytime.
            </p>
          </div>
        </motion.div>

        <motion.div {...motionProps(0.05)}>
          <Button
            onClick={() => navigate('/auth')}
            className="w-full font-mono text-xs"
          >
            Get started
          </Button>
        </motion.div>

        <motion.div {...motionProps()}>
          <Separator />
        </motion.div>

        {/* FAQ */}
        <motion.div {...motionProps()}>
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

        <motion.div {...motionProps()}>
          <Separator />
        </motion.div>

        {/* Footer */}
        <motion.div {...motionProps()}>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Holzen is not a trading tool. It won't tell you what to do. It exists to create a small space between impulse and decision.
          </p>
        </motion.div>

        <motion.div {...motionProps(0.05)}>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <span>·</span>
            <a href="mailto:hello@holzen.app" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
