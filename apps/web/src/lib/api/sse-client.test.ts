import { describe, expect, it } from 'vitest';
import { parseSseChunk } from './sse-client';

describe('parseSseChunk', () => {
  it('parses event and data lines', () => {
    const events = parseSseChunk('event: token\ndata: {"text":"hi"}\n\n');

    expect(events).toEqual([{ event: 'token', data: '{"text":"hi"}' }]);
  });
});
