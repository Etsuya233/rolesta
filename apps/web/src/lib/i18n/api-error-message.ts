import { I18N_MESSAGE_PREFIX, type ErrorMessageParams } from '@rolesta/shared';
import { i18n } from './i18n';

export function formatApiMessage(msg: string, params: ErrorMessageParams): string {
  if (!msg.startsWith(I18N_MESSAGE_PREFIX)) {
    return msg;
  }

  const key = msg.slice(I18N_MESSAGE_PREFIX.length);

  if (!i18n.exists(key)) {
    return msg;
  }

  return i18n.t(key, params);
}
