export const SUPPORTED_LOCALES = ['en-US', 'zh-CN', 'zh-TW', 'ja-JP'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en-US';

const LOCALE_ALIASES = {
  en: 'en-US',
  'en-us': 'en-US',
  zh: 'zh-CN',
  'zh-cn': 'zh-CN',
  'zh-hans': 'zh-CN',
  'zh-sg': 'zh-CN',
  'zh-tw': 'zh-TW',
  'zh-hant': 'zh-TW',
  'zh-hk': 'zh-TW',
  'zh-mo': 'zh-TW',
  ja: 'ja-JP',
  'ja-jp': 'ja-JP',
} as const satisfies Record<string, SupportedLocale>;

export function normalizeLocaleTag(localeTag: string): SupportedLocale | undefined {
  const normalizedTag = localeTag.split(';')[0]?.trim().toLowerCase();

  if (!normalizedTag) {
    return undefined;
  }

  if (normalizedTag in LOCALE_ALIASES) {
    return LOCALE_ALIASES[normalizedTag as keyof typeof LOCALE_ALIASES];
  }

  const language = normalizedTag.split('-')[0];
  return language ? LOCALE_ALIASES[language as keyof typeof LOCALE_ALIASES] : undefined;
}

export function resolveSupportedLocale(localeTags: readonly string[]): SupportedLocale {
  for (const localeTag of localeTags) {
    const supportedLocale = normalizeLocaleTag(localeTag);

    if (supportedLocale) {
      return supportedLocale;
    }
  }

  return DEFAULT_LOCALE;
}
