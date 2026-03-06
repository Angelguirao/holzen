import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
});

const About = () => {
  const prefersReduced = useReducedMotion();
  const m = (delay = 0) => (prefersReduced ? {} : fade(delay));

  return (
    <div className="min-h-screen flex items-start justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-14">
        {/* Nav */}
        <motion.div {...m()}>
          <Link
            to="/welcome"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </motion.div>

        {/* Title */}
        <motion.div {...m(0.05)}>
          <h1 className="text-xl text-foreground leading-relaxed">
            Why Holzen exists
          </h1>
        </motion.div>

        {/* Section: The opportunity */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              The opportunity & the problem
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              The democratisation of investing is one of the most important financial shifts of our time.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Platforms like Robinhood, Trade Republic, and countless others have opened markets that were once reserved for professionals. Anyone can now invest in stocks, ETFs, commodities — and Bitcoin. This is a genuinely good thing.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              But access is only half the equation. What these platforms don't provide is the emotional infrastructure to handle what comes next: the volatility, the uncertainty, the constant temptation to act when doing nothing would serve you better.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              That's the gap Holzen fills — not with more data or faster alerts, but with a practice of self-awareness: breathing exercises, AI-generated reflections, mood tracking, journaling, emotional tagging, and personal insights that reveal your patterns over time.
            </p>
          </div>
        </motion.div>

        {/* Section: Behavioral finance */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              What the research says
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              Investing is hard. Controlling your emotions under volatility is harder.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Behavioral finance has spent decades documenting this. Daniel Kahneman's work on System 1 and System 2 thinking shows that under stress, our fast, instinctive mind hijacks decisions before our slower, reflective mind can intervene. Barber and Odean's research found that the most active individual traders underperform by 6.5% annually — not because they lack information, but because they act on emotion.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This is true for experienced investors and beginners alike. The difference is that beginners often don't yet recognise the pattern: the urge to sell when prices fall, the urge to buy when prices surge. Both feel rational in the moment. Neither usually is.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We believe that small, well-timed interventions — a pause, a reflection, a moment of awareness — can meaningfully improve decision-making during these critical windows. Not advice. Not signals. Just enough friction to let your reflective mind catch up.
            </p>
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed italic">
              Kahneman, D. (2011). <em>Thinking, Fast and Slow</em>. · Barber, B. & Odean, T. (2000). "Trading Is Hazardous to Your Wealth." <em>The Journal of Finance</em>, 55(2). · Thaler, R. (2015). <em>Misbehaving: The Making of Behavioral Economics</em>.
            </p>
          </div>
        </motion.div>

        {/* Section: Why Bitcoin */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              Why Bitcoin
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              Holding Bitcoin is especially hard — and we think that's exactly why it's worth doing.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bitcoin behaves like a volatile tech stock in the short term, but we believe it is something fundamentally different: the best savings technology ever invented. A decentralised, scarce, programmable monetary network with no counterparty risk. The monetisation of a new store of value is a generational event — perhaps a millennium event.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We believe Bitcoin represents the most asymmetric bet in the history of financial markets. But capturing that asymmetry requires one thing above all else: the ability to hold through volatility. And that's where most people fail — not because the thesis is wrong, but because the emotional cost of conviction is brutally high.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Holzen exists to help people hold. Not blindly, not recklessly — but with awareness. We don't tell you what to do. We help you pause long enough to remember why you started.
            </p>
          </div>
        </motion.div>

        {/* Section: Micropreneurship */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              Our philosophy
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              Holzen is a micropreneur project — small by design.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We don't have investors, a growth team, or a roadmap optimised for scale. We have a simple product that does one thing well, a clear price, and users who value what we build. That's the model.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We believe the best software is often built by small teams — or even individuals — who care deeply about the problem they're solving. No engagement metrics, no dark patterns, no pressure to grow at all costs. Just a useful tool that earns its place by being genuinely helpful.
            </p>
          </div>
        </motion.div>

        {/* Section: About us */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              About us
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Holzen is built by a husband-and-wife team. We're Bitcoin holders ourselves, and we built this tool because we needed it. The moments of highest volatility are the moments we're most tempted to act — and we've learned, sometimes the hard way, that pausing almost always leads to better decisions.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We hope Holzen can do the same for you.
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div {...m()}>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-4 border-t border-border">
            <Link to="/welcome" className="hover:text-foreground transition-colors">Home</Link>
            <span>·</span>
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

export default About;
