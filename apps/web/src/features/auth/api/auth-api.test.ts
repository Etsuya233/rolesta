import type { ApiFetchResult } from '../../../lib/api/client';
import type { components } from '../../../lib/api/generated/schema';
import type { getCurrentUser } from './auth-api';
import { describe, expectTypeOf, it } from 'vitest';

describe('auth API types', () => {
  it('infers the current user response data from OpenAPI', () => {
    type CurrentUserResponse = components['schemas']['CurrentUserResponseDto'];

    expectTypeOf<Awaited<ReturnType<typeof getCurrentUser>>>().toEqualTypeOf<
      ApiFetchResult<CurrentUserResponse>
    >();
  });
});
