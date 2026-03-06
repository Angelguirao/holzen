import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

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

        {/* Footer */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Holzen is not a trading tool. It won't tell you what to do. It exists to create a small space between impulse and decision.
        </p>
      </div>
    </div>
  );
};

export default Landing;
