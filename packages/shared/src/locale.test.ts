import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, normalizeLocaleTag, resolveSupportedLocale } from './locale.js';

describe('locale normalization', () => {
  it('maps supported language tags to product locales', () => {
    expect(normalizeLocaleTag('en')).toBe('en-US');
    expect(normalizeLocaleTag('en-US')).toBe('en-US');
    expect(normalizeLocaleTag('zh-CN')).toBe('zh-CN');
    expect(normalizeLocaleTag('zh-Hans')).toBe('zh-CN');
    expect(normalizeLocaleTag('zh-TW')).toBe('zh-TW');
    expect(normalizeLocaleTag('zh-Hant')).toBe('zh-TW');
    expect(normalizeLocaleTag('ja')).toBe('ja-JP');
    expect(normalizeLocaleTag('ja-JP')).toBe('ja-JP');
  });

  it('ignores accept-language quality parameters', () => {
    expect(normalizeLocaleTag('zh-TW;q=0.9')).toBe('zh-TW');
  });

  it('uses the first supported locale from a list', () => {
    expect(resolveSupportedLocale(['fr-FR', 'ja-JP', 'en-US'])).toBe('ja-JP');
  });

  it('uses the product default when no locale is supported', () => {
    expect(resolveSupportedLocale(['fr-FR'])).toBe(DEFAULT_LOCALE);
  });
});
