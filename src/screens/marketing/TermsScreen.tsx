import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { PageMeta } from '@/app/components/PageMeta';
import { PublicFooter } from '@/app/components/PublicFooter';
import { PageHeading } from '@/app/components/PageHeading';

const TermsScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center">
      <PageMeta title="Terms of Service — Holzen" description="Terms of service for Holzen, a self-awareness app for volatile asset holders." path="/terms" />
      <div className="flex-1 w-full max-w-lg px-6 py-16 space-y-10">
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <PageHeading title="Terms of Service" subtitle="Last updated: March 6, 2026" />
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
            Holzen monitors price volatility for a user-selected cryptocurrency (from an in-app allowlist) and delivers AI-generated pause prompts when movement exceeds a user-defined threshold. Holzen is not a trading tool, financial advisor, or investment platform. Those prompts are intended solely to encourage pause and self-awareness — never to suggest, recommend, or imply any financial action.
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
            Holzen is offered through paid subscription plans (currently Pro and Pro+). Plan pricing and included allowances are shown in-app at checkout and may be updated over time. Payment is processed via Stripe. Your subscription renews automatically each billing cycle unless cancelled. You authorize recurring charges to your chosen payment method until you cancel.
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
            We collect only the data necessary to operate the Service: your email address, volatility threshold preference, and push notification tokens if enabled. Pause sessions and related AI copy are generated in real time and stored for your review. We do not sell, share, or monetize your personal data. Data is stored securely and transmitted over encrypted connections.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">7. Intellectual Property</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All content, design, and code comprising the Service are the property of Holzen. AI-generated pause content delivered to you is for your personal use. You may not reproduce, redistribute, or commercially exploit any part of the Service without written permission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">8. Disclaimer of Warranties</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Service is provided "as is" and "as available" without warranties of any kind. We do not guarantee uninterrupted access, accuracy of market data, or suitability of pause prompts for any purpose. Market data is sourced from third-party APIs and may be delayed or inaccurate.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">9. Limitation of Liability</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Holzen shall not be liable for any financial losses, damages, or consequences arising from your use of or reliance on the Service. This includes, without limitation, any trading decisions, investment outcomes, or actions taken based on content received through the Service. Our total liability is limited to the amount you paid in the 12 months preceding the claim.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">10. Termination</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We reserve the right to suspend or terminate your account at our discretion if you violate these terms or engage in abusive behavior. Upon termination, your right to use the Service ceases immediately.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">11. Business Entity</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Holzen is operated by [Your Company Name], a company registered in [Country/State], registration number [Registration Number]. Registered address: [Street Address, City, Postal Code, Country].
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">12. Invoices & Billing</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Invoices for your subscription are generated automatically and sent to the email address associated with your account. You can view and download past invoices through the Stripe customer portal accessible from your Settings page. Invoices include the business details listed in Section 11.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">13. Governing Law</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of [Country/State]. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of [City, Country].
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">14. Contact</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            For questions about these terms, reach out via the support channels provided within the app or email [contact@yourdomain.com].
          </p>
        </section>

        <Separator />

        <p className="text-xs text-muted-foreground leading-relaxed">
          Holzen is not a financial product. Nothing in this Service constitutes financial advice.
        </p>
      </div>
      <PublicFooter />
    </div>
  );
};

export default TermsScreen;
