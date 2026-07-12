import { loadDatabaseConfig, type DatabaseConfig } from '@rolesta/db';

export interface AppConfig {
  nodeEnv: string;
  host: string;
  port: number;
  requestBodyLimit: string;
  corsAllowedOrigins: string[];
  logging: AppLoggingConfig;
  files: FileStorageConfig;
  database: DatabaseConfig;
}

export interface FileStorageConfig {
  driver: 'local' | 'database';
  localDirectory: string;
  orphanRetentionHours: number;
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
const FILE_STORAGE_DRIVERS = ['local', 'database'] as const;

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
    files: {
      driver: fileStorageDriver(env.FILE_STORAGE_DRIVER),
      localDirectory: env.FILE_STORAGE_LOCAL_DIRECTORY ?? '.data/files',
      orphanRetentionHours: positiveInteger(env.FILE_ORPHAN_RETENTION_HOURS, 24),
    },
    database: loadDatabaseConfig(env),
  };
}

function fileStorageDriver(value: string | undefined): FileStorageConfig['driver'] {
  const driver = value ?? 'local';

  if (!FILE_STORAGE_DRIVERS.includes(driver as FileStorageConfig['driver'])) {
    throw new Error(`Unsupported FILE_STORAGE_DRIVER: ${driver}`);
  }

  return driver as FileStorageConfig['driver'];
}

function positiveInteger(value: string | undefined, defaultValue: number): number {
  const number = Number(value ?? defaultValue);

  if (!Number.isInteger(number) || number <= 0) {
    throw new Error('FILE_ORPHAN_RETENTION_HOURS must be a positive integer.');
  }

  return number;
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
