import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { PRICING } from './lib/pricing';
import en from './locales/en.json';

// Other locales (es, pt, de, nl, fr, tr) are kept in /src/locales/ but disabled for now.
// Re-enable by importing and adding to resources below.

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
      freeReflectionsPerMonth: PRICING.freeReflectionsPerMonth,
    },
  },
});

export default i18n;
