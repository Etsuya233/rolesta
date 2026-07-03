import { existsSync } from 'node:fs';
import process from 'node:process';

export function loadLocalEnvFile(): void {
  // DB package scripts run from packages/db, so this loads packages/db/.env.
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
}
