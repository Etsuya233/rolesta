import type { components } from '../../../lib/api/generated/schema';
import type { getCurrentUser, getSetupStatus, login, setupAdmin } from './auth-api';
import { describe, expectTypeOf, it } from 'vitest';

describe('auth API types', () => {
  it('infers the current user response data from OpenAPI', () => {
    type CurrentUserResponse = components['schemas']['CurrentUserResponseDto'];

    expectTypeOf<Awaited<ReturnType<typeof getCurrentUser>>>().toEqualTypeOf<CurrentUserResponse>();
  });

  it('infers the setup status response data from OpenAPI', () => {
    type SetupStatusResponse = components['schemas']['SetupStatusResponseDto'];

    expectTypeOf<Awaited<ReturnType<typeof getSetupStatus>>>().toEqualTypeOf<SetupStatusResponse>();
  });

  it('infers authenticated responses from OpenAPI', () => {
    type AuthenticatedUserResponse = components['schemas']['AuthenticatedUserResponseDto'];

    expectTypeOf<Awaited<ReturnType<typeof login>>>().toEqualTypeOf<AuthenticatedUserResponse>();
    expectTypeOf<
      Awaited<ReturnType<typeof setupAdmin>>
    >().toEqualTypeOf<AuthenticatedUserResponse>();
  });
});
