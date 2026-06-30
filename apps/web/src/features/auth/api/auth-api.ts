import { apiGet } from '../../../lib/api/client';
import type { CurrentUserResponse } from '../../../lib/api/openapi-types';

export function getCurrentUser(): Promise<CurrentUserResponse> {
  return apiGet<CurrentUserResponse>('/auth/current-user');
}
