import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { PRICING } from '@/features/subscription/public';
import en from './locales/en.json';

// Full pre-strip locale bundles live in src/legacy/locales/ (not loaded at runtime).
// Re-enable by importing and adding to resources below; keep keys in sync with en.json.

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
    defaultVariables: {
      price: PRICING.monthlyPrice,
      trialDays: PRICING.trialDays,
    },
  },
});

export default i18n;
