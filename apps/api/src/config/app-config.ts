import { loadDatabaseConfig, type DatabaseConfig } from '@rolesta/db';

export interface AppConfig {
  nodeEnv: string;
  host: string;
  port: number;
  database: DatabaseConfig;
}

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    host: env.API_HOST ?? '127.0.0.1',
    port: Number.parseInt(env.API_PORT ?? '3000', 10),
    database: loadDatabaseConfig(env),
  };
}
