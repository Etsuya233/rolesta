export interface SseEvent {
  event: string;
  data: string;
}

export function parseSseChunk(chunk: string): SseEvent[] {
  return chunk
    .split('\n\n')
    .filter((block) => block.trim().length > 0)
    .map((block) => {
      const lines = block.split('\n');
      const eventLine = lines.find((line) => line.startsWith('event:'));
      const dataLine = lines.find((line) => line.startsWith('data:'));

      return {
        event: eventLine?.slice('event:'.length).trim() ?? 'message',
        data: dataLine?.slice('data:'.length).trim() ?? '',
      };
    });
}
