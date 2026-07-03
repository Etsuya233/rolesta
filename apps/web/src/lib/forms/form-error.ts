import { ApiError } from '../api/client';
import { formatApiMessage } from '../i18n/api-error-message';
import { i18n } from '../i18n/i18n';

export function getFormErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.envelope) {
    return formatApiMessage(error.envelope.msg, error.envelope.data);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return i18n.t('common.errors.requestFailed');
}
