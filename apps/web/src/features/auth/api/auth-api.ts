import type { ApiFetchResult } from '../../../lib/api/client';
import type { components } from '../../../lib/api/generated/schema';
import { openApiClient, requestApi } from '../../../lib/api/client';

type CurrentUserResponse = components['schemas']['CurrentUserResponseDto'];

export function getCurrentUser(): Promise<ApiFetchResult<CurrentUserResponse>> {
  return requestApi<CurrentUserResponse>(openApiClient.GET('/auth/current-user'));
}
