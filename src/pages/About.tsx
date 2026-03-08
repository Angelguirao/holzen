import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';

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
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed italic">
              {t('about.researchCitation')}
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
              Holzen exists to help people hold — with awareness. We don't tell you what to do. We help you pause long enough to notice your impulse, name it, and choose deliberately. Your reflection library, mood patterns, and outcome tracking become a mirror: proof that you can sit with discomfort and come out the other side with your conviction intact.
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
              We don't have investors, a growth team, or a roadmap optimised for scale. We have a focused product, a <Link to="/roadmap" className="underline hover:text-foreground transition-colors">public roadmap</Link> shaped by user votes, a clear price, and users who value what we build. That's the model.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We believe the best software is often built by small teams — or even individuals — who care deeply about the problem they're solving. No engagement metrics, no dark patterns, no pressure to grow at all costs. Just a useful tool that earns its place by being genuinely helpful.
            </p>
          </div>
        </motion.div>

        {/* Section: BTC Reserve */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              BTC Reserve
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              We hold what we help others hold.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Holzen maintains a Bitcoin reserve as a long-term store of value — not as speculation, but as a statement of conviction. We believe a product that helps people hold should itself hold.
            </p>
            <Link
              to="/reserve"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:text-primary/80 transition-colors"
            >
              Read our full reserve strategy →
            </Link>
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
