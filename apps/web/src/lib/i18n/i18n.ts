import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getInitialLocale, writeStoredLocale } from './locales';
import { resources } from './resources';
import type { SupportedLocale } from '@rolesta/shared';

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLocale(),
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
});

export function getActiveLocale(): SupportedLocale {
  return i18n.language as SupportedLocale;
}

export async function changeLocale(locale: SupportedLocale): Promise<void> {
  await i18n.changeLanguage(locale);

  if (typeof window !== 'undefined') {
    writeStoredLocale(window.localStorage, locale);
  }
}

export { i18n };
