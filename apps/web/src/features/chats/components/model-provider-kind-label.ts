export function formatModelProviderKind(kind: string): string {
  if (kind === 'openai-compatible') return 'OpenAI Compatible';
  if (kind === 'z-ai') return 'Z.AI';

  return kind
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
