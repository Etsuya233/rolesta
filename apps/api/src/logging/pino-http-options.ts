import type { Options as PinoHttpOptions } from 'pino-http';
import type { AppLoggingConfig } from '../config/app-config.js';

export function pinoHttpOptionsFor(config: AppLoggingConfig): PinoHttpOptions {
  const options: PinoHttpOptions = {
    level: config.level,
    autoLogging: false,
    quietReqLogger: true,
  };

  options.transport = pinoTransportFor(config);

  return options;
}

function pinoTransportFor(config: AppLoggingConfig): NonNullable<PinoHttpOptions['transport']> {
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

  return consolePrettyTarget(config.pretty);
}

function consoleTargetFor(config: AppLoggingConfig) {
  return {
    ...consolePrettyTarget(config.pretty),
    level: config.level,
  };
}

function consolePrettyTarget(colorize: boolean) {
  return {
    target: 'pino-pretty',
    options: {
      colorize,
      singleLine: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,req,request,response,context',
    },
  };
}
