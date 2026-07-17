import { describe, expect, it } from 'vitest';
import { pinoHttpOptionsFor } from './pino-http-options.js';

describe('pinoHttpOptionsFor', () => {
  it('uses a compact console transport without full request and response details', () => {
    const options = pinoHttpOptionsFor({
      level: 'info',
      httpEnabled: true,
      pretty: false,
      fileEnabled: false,
      filePath: '.data/logs/api.log',
    });

    expect(options.autoLogging).toBe(false);
    expect(options.quietReqLogger).toBe(true);
    expect(options.transport).toMatchObject({
      target: 'pino-pretty',
      options: {
        colorize: false,
        singleLine: true,
        ignore: 'pid,hostname,req,request,response,context',
      },
    });
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
          options: {
            colorize: true,
            ignore: 'pid,hostname,req,request,response,context',
          },
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
