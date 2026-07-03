import { describe, expect, it } from 'vitest';
import { loadAppConfig } from './app-config.js';

describe('loadAppConfig', () => {
  it('uses development logging defaults', () => {
    const config = loadAppConfig({});

    expect(config.logging).toEqual({
      level: 'info',
      httpEnabled: true,
      pretty: true,
      fileEnabled: false,
      filePath: '.data/logs/api.log',
    });
  });

  it('uses JSON logs by default in production', () => {
    const config = loadAppConfig({ NODE_ENV: 'production' });

    expect(config.logging.pretty).toBe(false);
  });

  it('reads explicit logging settings from env', () => {
    const config = loadAppConfig({
      LOG_LEVEL: 'debug',
      LOG_HTTP_ENABLED: 'false',
      LOG_PRETTY: 'false',
      LOG_FILE_ENABLED: 'true',
      LOG_FILE_PATH: 'logs/api.log',
    });

    expect(config.logging).toEqual({
      level: 'debug',
      httpEnabled: false,
      pretty: false,
      fileEnabled: true,
      filePath: 'logs/api.log',
    });
  });
});
