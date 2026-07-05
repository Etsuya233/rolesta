import { describe, expect, it } from 'vitest';
import { countPromptTokens, PROMPT_TOKENIZER } from './prompt-tokenizer.js';

describe('countPromptTokens', () => {
  it('counts prompt text with cl100k_base', () => {
    expect(PROMPT_TOKENIZER).toBe('cl100k_base');
    expect(countPromptTokens('hello')).toBe(1);
    expect(countPromptTokens('你好，世界')).toBeGreaterThan(1);
  });
});
