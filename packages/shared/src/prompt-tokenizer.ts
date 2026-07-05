import { encode } from 'gpt-tokenizer/encoding/cl100k_base';

export const PROMPT_TOKENIZER = 'cl100k_base' as const;
export type PromptTokenizer = typeof PROMPT_TOKENIZER;

export function countPromptTokens(content: string): number {
  return encode(content).length;
}
