export interface AppConfig {
  nodeEnv: string;
  host: string;
  port: number;
  databaseDialect: 'sqlite';
  sqliteDatabasePath: string;
  sessionSecret: string;
}

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    host: env.API_HOST ?? '127.0.0.1',
    port: Number.parseInt(env.API_PORT ?? '3000', 10),
    databaseDialect: 'sqlite',
    sqliteDatabasePath: env.SQLITE_DATABASE_PATH ?? '.data/rolesta.sqlite',
    sessionSecret: env.SESSION_SECRET ?? 'change-me-in-local-development',
  };
}
