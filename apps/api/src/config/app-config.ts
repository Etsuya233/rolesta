import { loadDatabaseConfig, type DatabaseConfig } from '@rolesta/db';

export interface AppConfig {
  nodeEnv: string;
  host: string;
  port: number;
  corsAllowedOrigins: string[];
  database: DatabaseConfig;
}

const DEFAULT_CORS_ALLOWED_ORIGINS = ['http://127.0.0.1:5173', 'http://localhost:5173'];

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    host: env.API_HOST ?? '127.0.0.1',
    port: Number.parseInt(env.API_PORT ?? '3000', 10),
    corsAllowedOrigins: corsAllowedOriginsFrom(env.CORS_ALLOWED_ORIGINS),
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
