import { DomainError } from '../../common/errors/index.js';

export class PresetDomainError extends DomainError<'invalid-prompt-model', { field: string }> {
  constructor(field: string, message: string) {
    super({ reason: 'invalid-prompt-model', params: { field } });
    this.message = message;
  }
}
