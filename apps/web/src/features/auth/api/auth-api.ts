import { openApiClient, requestApi } from '../../../lib/api/client';

export async function getCurrentUser() {
  const result = await requestApi(openApiClient.GET('/auth/current-user'));
  return result.data;
}
