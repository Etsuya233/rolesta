import type { UserAccountStore } from './auth-ports.js';
import type { SetupStatusResult } from './auth-results.js';

export class GetSetupStatusUseCase {
  constructor(private readonly users: UserAccountStore) {}

  async execute(): Promise<SetupStatusResult> {
    return { requiresSetup: (await this.users.count()) === 0 };
  }
}
