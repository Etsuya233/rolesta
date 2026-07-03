import { DEFAULT_LOCALE, normalizeLocaleTag, resolveSupportedLocale } from '@rolesta/shared';
import type { SupportedLocale } from '@rolesta/shared';

export const LOCALE_STORAGE_KEY = 'rolesta.locale';

export function readStoredLocale(storage: Storage): SupportedLocale | undefined {
  const storedLocale = storage.getItem(LOCALE_STORAGE_KEY);
  return storedLocale ? normalizeLocaleTag(storedLocale) : undefined;
}

export function writeStoredLocale(storage: Storage, locale: SupportedLocale): void {
  storage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function detectBrowserLocale(navigatorLanguages: readonly string[]): SupportedLocale {
  return resolveSupportedLocale(navigatorLanguages);
}

export function getInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const storedLocale = readStoredLocale(window.localStorage);

  if (storedLocale) {
    return storedLocale;
  }

  return detectBrowserLocale(window.navigator.languages);
}
