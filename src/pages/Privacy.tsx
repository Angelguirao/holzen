import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { PageMeta } from '@/components/PageMeta';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex justify-center p-6 py-16">
      <div className="w-full max-w-lg space-y-10">
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-medium text-foreground">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: March 6, 2026</p>
        </div>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">1. What We Collect</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We collect only what is necessary to operate the Service: your email address (for authentication and optional email notifications), your volatility threshold preference, and push notification tokens if you enable browser notifications. We also store reflections generated for you so you can review them later.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">2. How We Use Your Data</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your data is used solely to deliver the Service — monitoring volatility against your threshold, generating and delivering reflections, and managing your subscription. We do not use your data for advertising, profiling, or any purpose unrelated to the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">3. Data Storage & Security</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your data is stored on secure, encrypted infrastructure. All communication between your browser and our servers uses TLS encryption. Database access is restricted and protected by row-level security policies. We retain your data only for as long as your account is active.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">4. Third-Party Services</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We use the following third-party services to operate Holzen:
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed list-disc list-inside">
            <li><span className="text-foreground">Stripe</span> — for payment processing. Stripe handles your payment information directly; we never store your card details.</li>
            <li><span className="text-foreground">AI providers</span> — for generating reflections. Only market context (not personal data) is sent to generate your reflection.</li>
            <li><span className="text-foreground">CoinGecko</span> — for Bitcoin price and volatility data. No user data is shared with this service.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">5. Cookies & Tracking</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Holzen does not use tracking cookies, analytics pixels, or any third-party tracking scripts. We use only essential session cookies required for authentication.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">6. Your Rights</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You have the right to:
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground leading-relaxed list-disc list-inside">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and all associated data</li>
            <li>Export your reflection history</li>
            <li>Withdraw consent for optional notifications at any time</li>
          </ul>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To exercise any of these rights, contact us through the support channels in the app.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">7. Data Deletion</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When you cancel your subscription and request account deletion, all your personal data — including your profile, preferences, reflections, and notification tokens — will be permanently deleted within 30 days.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">8. Changes to This Policy</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We may update this policy from time to time. Material changes will be communicated via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">9. Contact</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            For privacy-related questions or requests, reach out via the support channels provided within the app.
          </p>
        </section>

        <Separator />

        <p className="text-xs text-muted-foreground leading-relaxed">
          Holzen exists to create space between impulse and decision — not to collect or exploit your data.
        </p>
      </div>
    </div>
  );
};

export default Privacy;
