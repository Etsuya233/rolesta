export type DatabaseDialect = 'sqlite' | 'postgres' | 'mysql';

export type DatabaseConfig =
  | {
      dialect: 'sqlite';
      databasePath: string;
    }
  | {
      dialect: 'postgres';
      connectionString: string;
    }
  | {
      dialect: 'mysql';
      connectionString: string;
    };

export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const dialect = parseDatabaseDialect(env.DATABASE_DIALECT);

  switch (dialect) {
    case 'sqlite':
      return {
        dialect,
        databasePath: env.SQLITE_DATABASE_PATH ?? '.data/rolesta.sqlite',
      };
    case 'postgres':
    case 'mysql':
      return {
        dialect,
        connectionString: env.DATABASE_URL ?? '',
      };
  }
}

function parseDatabaseDialect(value: string | undefined): DatabaseDialect {
  switch (value ?? 'sqlite') {
    case 'sqlite':
      return 'sqlite';
    case 'postgres':
      return 'postgres';
    case 'mysql':
      return 'mysql';
    default:
      throw new Error(`Unsupported database dialect "${value}".`);
  }
}
