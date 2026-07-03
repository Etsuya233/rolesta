import { beforeEach, describe, expect, it } from 'vitest';
import {
  LOCALE_STORAGE_KEY,
  detectBrowserLocale,
  readStoredLocale,
  writeStoredLocale,
} from './locales';

describe('web locale storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reads a supported locale from storage', () => {
    const storage = window.localStorage;
    storage.setItem(LOCALE_STORAGE_KEY, 'zh-Hant');

    expect(readStoredLocale(storage)).toBe('zh-TW');
  });

  it('writes the selected locale to storage', () => {
    const storage = window.localStorage;

    writeStoredLocale(storage, 'ja-JP');

    expect(storage.getItem(LOCALE_STORAGE_KEY)).toBe('ja-JP');
  });

  it('detects the first supported browser locale', () => {
    expect(detectBrowserLocale(['fr-FR', 'zh-CN', 'en-US'])).toBe('zh-CN');
  });
});
