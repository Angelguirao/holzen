export type LegalSection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
};

export const termsCopy = {
  meta: {
    title: 'Terms of Service — Holzen',
    description:
      'Terms of service for Holzen, a self-awareness app for investors during market volatility.',
    path: '/terms',
  },
  title: 'Terms of Service',
  subtitle: 'Last updated: March 6, 2026',
  sections: [
    {
      title: '1. Acceptance of Terms',
      paragraphs: [
        'By accessing or using Holzen ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. We reserve the right to update these terms at any time. Continued use after changes constitutes acceptance.',
      ],
    },
    {
      title: '2. Description of Service',
      paragraphs: [
        'Holzen monitors price volatility for a user-selected cryptocurrency (from an in-app allowlist) and delivers AI-generated pause prompts when movement exceeds a user-defined threshold. Holzen is not a trading tool, financial advisor, or investment platform. Those prompts are intended solely to encourage pause and self-awareness — never to suggest, recommend, or imply any financial action.',
      ],
    },
    {
      title: '3. Account & Eligibility',
      paragraphs: [
        'You must be at least 18 years old to use the Service. You are responsible for maintaining the security of your account credentials. You may not share your account or use the Service for any unlawful purpose.',
      ],
    },
    {
      title: '4. Subscription & Payments',
      paragraphs: [
        'Holzen is offered through paid subscription plans (currently Pro and Pro+). Plan pricing and included allowances are shown in-app at checkout and may be updated over time. Payment is processed via Stripe. Your subscription renews automatically each billing cycle unless cancelled. You authorize recurring charges to your chosen payment method until you cancel.',
      ],
    },
    {
      title: '5. Cancellation & Refunds',
      paragraphs: [
        'You may cancel your subscription at any time through the customer portal. Cancellation takes effect at the end of the current billing period — you retain access until then. Refunds are not provided for partial billing periods. If you believe you were charged in error, contact us and we will review your case.',
      ],
    },
    {
      title: '6. Data Handling & Privacy',
      paragraphs: [
        'We collect only the data necessary to operate the Service: your email address, volatility threshold preference, and push notification tokens if enabled. Pause sessions and related AI copy are generated in real time and stored for your review. We do not sell, share, or monetize your personal data. Data is stored securely and transmitted over encrypted connections.',
      ],
    },
    {
      title: '7. Intellectual Property',
      paragraphs: [
        'All content, design, and code comprising the Service are the property of Holzen. AI-generated pause content delivered to you is for your personal use. You may not reproduce, redistribute, or commercially exploit any part of the Service without written permission.',
      ],
    },
    {
      title: '8. Disclaimer of Warranties',
      paragraphs: [
        'The Service is provided "as is" and "as available" without warranties of any kind. We do not guarantee uninterrupted access, accuracy of market data, or suitability of pause prompts for any purpose. Market data is sourced from third-party APIs and may be delayed or inaccurate.',
      ],
    },
    {
      title: '9. Limitation of Liability',
      paragraphs: [
        'Holzen shall not be liable for any financial losses, damages, or consequences arising from your use of or reliance on the Service. This includes, without limitation, any trading decisions, investment outcomes, or actions taken based on content received through the Service. Our total liability is limited to the amount you paid in the 12 months preceding the claim.',
      ],
    },
    {
      title: '10. Termination',
      paragraphs: [
        'We reserve the right to suspend or terminate your account at our discretion if you violate these terms or engage in abusive behavior. Upon termination, your right to use the Service ceases immediately.',
      ],
    },
    {
      title: '11. Business Entity',
      paragraphs: [
        'Holzen is operated by [Your Company Name], a company registered in [Country/State], registration number [Registration Number]. Registered address: [Street Address, City, Postal Code, Country].',
      ],
    },
    {
      title: '12. Invoices & Billing',
      paragraphs: [
        'Invoices for your subscription are generated automatically and sent to the email address associated with your account. You can view and download past invoices through the Stripe customer portal accessible from your Settings page. Invoices include the business details listed in Section 11.',
      ],
    },
    {
      title: '13. Governing Law',
      paragraphs: [
        'These Terms shall be governed by and construed in accordance with the laws of [Country/State]. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of [City, Country].',
      ],
    },
    {
      title: '14. Contact',
      paragraphs: [
        'For questions about these terms, reach out via the support channels provided within the app or email [contact@yourdomain.com].',
      ],
    },
  ] satisfies LegalSection[],
  closing:
    'Holzen is not a financial product. Nothing in this Service constitutes financial advice.',
};

export const privacyCopy = {
  meta: {
    title: 'Privacy Policy — Holzen',
    description:
      "How Holzen handles your data. We collect only what's needed and you can export or delete everything anytime.",
    path: '/privacy',
  },
  title: 'Privacy Policy',
  subtitle: 'Last updated: March 6, 2026',
  sections: [
    {
      title: '1. What We Collect',
      paragraphs: [
        'We collect only what is necessary to operate the Service: your email address (for authentication and optional email notifications), your volatility threshold preference, and push notification tokens if you enable browser notifications. We also store pause sessions and related AI copy generated for you so you can review them later.',
      ],
    },
    {
      title: '2. How We Use Your Data',
      paragraphs: [
        'Your data is used solely to deliver the Service — monitoring volatility against your threshold, generating and delivering pause experiences, and managing your subscription. We do not use your data for advertising, profiling, or any purpose unrelated to the Service.',
      ],
    },
    {
      title: '3. Data Storage & Security',
      paragraphs: [
        'Your data is stored on secure, encrypted infrastructure. All communication between your browser and our servers uses TLS encryption. Database access is restricted and protected by row-level security policies. We retain your data only for as long as your account is active.',
      ],
    },
    {
      title: '4. Third-Party Services',
      paragraphs: ['We use the following third-party services to operate Holzen:'],
      list: [
        'Stripe — for payment processing. Stripe handles your payment information directly; we never store your card details.',
        'AI providers — for generating pause prompts. Only market context (not personal data) is sent to produce your reflect-step copy.',
        'CoinGecko — for Bitcoin price and volatility data. No user data is shared with this service.',
      ],
    },
    {
      title: '5. Cookies & Tracking',
      paragraphs: [
        'Holzen does not use tracking cookies, analytics pixels, or any third-party tracking scripts. We use only essential session cookies required for authentication.',
      ],
    },
    {
      title: '6. Your Rights',
      paragraphs: ['You have the right to:'],
      list: [
        'Access the personal data we hold about you',
        'Request correction of inaccurate data',
        'Request deletion of your account and all associated data',
        'Export your pause history',
        'Withdraw consent for optional notifications at any time',
      ],
      paragraphsAfter: [
        'To exercise any of these rights, contact us through the support channels in the app.',
      ],
    },
    {
      title: '7. Data Deletion',
      paragraphs: [
        'When you cancel your subscription and request account deletion, all your personal data — including your profile, preferences, pause history, and notification tokens — will be permanently deleted within 30 days.',
      ],
    },
    {
      title: '8. Changes to This Policy',
      paragraphs: [
        'We may update this policy from time to time. Material changes will be communicated via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the updated policy.',
      ],
    },
    {
      title: '9. Contact',
      paragraphs: [
        'For privacy-related questions or requests, reach out via the support channels provided within the app.',
      ],
    },
  ],
  closing:
    'Holzen exists to create space between impulse and decision — not to collect or exploit your data.',
};
