import { openApiClient, requestApi } from '../../../lib/api/client';

export function getCurrentUser() {
  return requestApi(openApiClient.GET('/auth/current-user'));
}
