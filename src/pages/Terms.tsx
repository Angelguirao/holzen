import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { PageMeta } from '@/components/PageMeta';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex justify-center p-6 py-16">
      <PageMeta title="Terms of Service — Holzen" description="Terms of service for Holzen, the Bitcoin self-awareness app." path="/terms" />
      <div className="w-full max-w-lg space-y-10">
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-medium text-foreground">Terms of Service</h1>
          <p className="text-xs text-muted-foreground">Last updated: March 6, 2026</p>
        </div>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">1. Acceptance of Terms</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            By accessing or using Holzen ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. We reserve the right to update these terms at any time. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">2. Description of Service</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Holzen monitors Bitcoin volatility and delivers AI-generated reflections when market movement exceeds a user-defined threshold. Holzen is not a trading tool, financial advisor, or investment platform. Reflections are intended solely to encourage pause and self-awareness — never to suggest, recommend, or imply any financial action.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">3. Account & Eligibility</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You must be at least 18 years old to use the Service. You are responsible for maintaining the security of your account credentials. You may not share your account or use the Service for any unlawful purpose.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">4. Subscription & Payments</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Holzen is offered as a paid subscription at $3/month. Payment is processed via Stripe. Your subscription renews automatically each billing cycle unless cancelled. You authorize recurring charges to your chosen payment method until you cancel.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">5. Cancellation & Refunds</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You may cancel your subscription at any time through the customer portal. Cancellation takes effect at the end of the current billing period — you retain access until then. Refunds are not provided for partial billing periods. If you believe you were charged in error, contact us and we will review your case.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">6. Data Handling & Privacy</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We collect only the data necessary to operate the Service: your email address, volatility threshold preference, and push notification tokens if enabled. Reflections are generated in real time and stored for your review. We do not sell, share, or monetize your personal data. Data is stored securely and transmitted over encrypted connections.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">7. Intellectual Property</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All content, design, and code comprising the Service are the property of Holzen. AI-generated reflections delivered to you are for your personal use. You may not reproduce, redistribute, or commercially exploit any part of the Service without written permission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">8. Disclaimer of Warranties</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Service is provided "as is" and "as available" without warranties of any kind. We do not guarantee uninterrupted access, accuracy of market data, or suitability of reflections for any purpose. Bitcoin price data is sourced from third-party APIs and may be delayed or inaccurate.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">9. Limitation of Liability</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Holzen shall not be liable for any financial losses, damages, or consequences arising from your use of or reliance on the Service. This includes, without limitation, any trading decisions, investment outcomes, or actions taken based on reflections received through the Service. Our total liability is limited to the amount you paid in the 12 months preceding the claim.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">10. Termination</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We reserve the right to suspend or terminate your account at our discretion if you violate these terms or engage in abusive behavior. Upon termination, your right to use the Service ceases immediately.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">11. Contact</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            For questions about these terms, reach out via the support channels provided within the app.
          </p>
        </section>

        <Separator />

        <p className="text-xs text-muted-foreground leading-relaxed">
          Holzen is not a financial product. Nothing in this Service constitutes financial advice.
        </p>
      </div>
    </div>
  );
};

export default Terms;
