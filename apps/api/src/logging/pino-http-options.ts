import type { Options as PinoHttpOptions } from 'pino-http';
import type { AppLoggingConfig } from '../config/app-config.js';

export function pinoHttpOptionsFor(config: AppLoggingConfig): PinoHttpOptions {
  const options: PinoHttpOptions = {
    level: config.level,
    autoLogging: false,
  };

  const transport = pinoTransportFor(config);
  if (transport !== undefined) {
    options.transport = transport;
  }

  return options;
}

function pinoTransportFor(config: AppLoggingConfig): PinoHttpOptions['transport'] | undefined {
  if (config.fileEnabled) {
    return {
      targets: [
        consoleTargetFor(config),
        {
          target: 'pino/file',
          level: config.level,
          options: {
            destination: config.filePath,
            mkdir: true,
          },
        },
      ],
    };
  }

  if (config.pretty) {
    return consolePrettyTarget();
  }

  return undefined;
}

function consoleTargetFor(config: AppLoggingConfig) {
  if (config.pretty) {
    return {
      ...consolePrettyTarget(),
      level: config.level,
    };
  }

  return {
    target: 'pino/file',
    level: config.level,
    options: {
      destination: 1,
    },
  };
}

function consolePrettyTarget() {
  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  };
}
