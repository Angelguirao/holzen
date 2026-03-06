import { useNavigate, Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-10">
        {/* Header */}
        <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
          Holzen
        </h1>

        {/* Hero */}
        <div className="space-y-4">
          <p className="text-xl leading-relaxed text-foreground">
            When Bitcoin moves, pause before you do.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Holzen watches volatility so you don't have to. When the market crosses your threshold, you receive one quiet reflection — not advice, not urgency — just a moment to consider your intentions.
          </p>
        </div>

        <Separator />

        {/* How it works */}
        <div className="space-y-4">
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
            How it works
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-foreground">Set your threshold</p>
              <p className="text-xs text-muted-foreground">Choose the percentage of 24h volatility that matters to you.</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-foreground">Receive a reflection</p>
              <p className="text-xs text-muted-foreground">When volatility crosses your line, an AI-generated message encourages pause — never action.</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-foreground">Nothing more</p>
              <p className="text-xs text-muted-foreground">No charts, no alerts, no trading signals. One message, then silence for six hours.</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Pricing */}
        <div className="space-y-2">
          <p className="text-sm text-foreground">$3/month</p>
          <p className="text-xs text-muted-foreground">
            AI reflections via push, email, or in-app. Cancel anytime.
          </p>
        </div>

        <Button
          onClick={() => navigate('/auth')}
          className="w-full font-mono text-xs"
        >
          Get started
        </Button>

        <Separator />

        {/* FAQ */}
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

        <Separator />

        {/* Footer */}
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
    </div>
  );
};

export default Landing;
