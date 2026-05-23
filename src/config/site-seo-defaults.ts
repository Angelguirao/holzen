import { PRICING } from "@/features/subscription/public";
import { SITE_ORIGIN } from "@/config/site";

/** Default document title (index.html + PageMeta reset). */
export const DEFAULT_SITE_TITLE = "Holzen — Pause before you act";

/** Default meta description (index.html + PageMeta reset). */
export const DEFAULT_SITE_DESCRIPTION =
  "When Bitcoin moves, pause before you do. Holzen watches volatility and sends AI-generated reflections — not advice, not urgency — just a moment to consider.";

/** Absolute URL for default Open Graph / Twitter / JSON-LD image. */
export const DEFAULT_OG_IMAGE_URL = `${SITE_ORIGIN}/og-image.png`;

/** JSON-LD SoftwareApplication offer — keep in sync with `PRICING` + trial copy. */
export function jsonLdOfferBlock(): {
  price: string;
  description: string;
} {
  return {
    price: PRICING.monthlyPrice.toFixed(2),
    description: `${PRICING.trialDays}-day free trial of Pro, then $${PRICING.monthlyPrice}/month. Unlimited pauses and AI companions. Cancel anytime.`,
  };
}
