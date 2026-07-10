import { loadDatabaseConfig, type DatabaseConfig } from '@rolesta/db';

export interface AppConfig {
  nodeEnv: string;
  host: string;
  port: number;
  requestBodyLimit: string;
  corsAllowedOrigins: string[];
  logging: AppLoggingConfig;
  database: DatabaseConfig;
}

export interface AppLoggingConfig {
  level: string;
  httpEnabled: boolean;
  pretty: boolean;
  fileEnabled: boolean;
  filePath: string;
}

const DEFAULT_CORS_ALLOWED_ORIGINS = ['http://127.0.0.1:5173', 'http://localhost:5173'];
const DEFAULT_LOG_FILE_PATH = '.data/logs/api.log';

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';

  return {
    nodeEnv,
    host: env.API_HOST ?? '127.0.0.1',
    port: Number.parseInt(env.API_PORT ?? '3000', 10),
    requestBodyLimit: env.API_REQUEST_BODY_LIMIT ?? '1mb',
    corsAllowedOrigins: corsAllowedOriginsFrom(env.CORS_ALLOWED_ORIGINS),
    logging: {
      level: env.LOG_LEVEL ?? 'info',
      httpEnabled: envFlag(env.LOG_HTTP_ENABLED, true),
      pretty: envFlag(env.LOG_PRETTY, nodeEnv !== 'production'),
      fileEnabled: envFlag(env.LOG_FILE_ENABLED, false),
      filePath: env.LOG_FILE_PATH ?? DEFAULT_LOG_FILE_PATH,
    },
    database: loadDatabaseConfig(env),
  };
}

function corsAllowedOriginsFrom(value: string | undefined): string[] {
  if (value === undefined || value.trim().length === 0) {
    return [...DEFAULT_CORS_ALLOWED_ORIGINS];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function envFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim().length === 0) {
    return defaultValue;
  }

  return value === 'true';
}
