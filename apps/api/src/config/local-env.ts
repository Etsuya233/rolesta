import { existsSync } from 'node:fs';
import process from 'node:process';

export function loadLocalEnvFile(): void {
  // API package scripts run from apps/api, so this loads apps/api/.env.
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
}
