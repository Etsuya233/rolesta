import { UseCase } from '../../common/errors/index.js';
import { translateAuthError } from './auth-error.mapper.js';
import type { UserAccountStore } from '../ports/auth-ports.js';
import type { SetupStatusResult } from './auth-results.js';

export class GetSetupStatusUseCase {
  constructor(private readonly users: UserAccountStore) {}

  @UseCase(translateAuthError)
  async execute(): Promise<SetupStatusResult> {
    return { requiresSetup: (await this.users.count()) === 0 };
  }
}
