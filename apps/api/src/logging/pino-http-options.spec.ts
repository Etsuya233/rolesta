import { describe, expect, it } from 'vitest';
import { pinoHttpOptionsFor } from './pino-http-options.js';

describe('pinoHttpOptionsFor', () => {
  it('disables pino-http automatic access logs', () => {
    const options = pinoHttpOptionsFor({
      level: 'info',
      httpEnabled: true,
      pretty: false,
      fileEnabled: false,
      filePath: '.data/logs/api.log',
    });

    expect(options.autoLogging).toBe(false);
    expect(options.transport).toBeUndefined();
  });

  it('keeps console output when file output is enabled', () => {
    const options = pinoHttpOptionsFor({
      level: 'debug',
      httpEnabled: true,
      pretty: true,
      fileEnabled: true,
      filePath: '.data/logs/api.log',
    });

    expect(options.transport).toMatchObject({
      targets: [
        {
          target: 'pino-pretty',
          level: 'debug',
        },
        {
          target: 'pino/file',
          level: 'debug',
          options: {
            destination: '.data/logs/api.log',
            mkdir: true,
          },
        },
      ],
    });
  });
});
