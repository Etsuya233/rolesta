import type { paths } from './generated/schema';

export type CurrentUserResponse =
  paths['/auth/current-user']['get']['responses']['200']['content']['application/json'];
