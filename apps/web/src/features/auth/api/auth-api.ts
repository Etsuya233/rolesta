import { openApiClient, requestApi } from '../../../lib/api/client';
import { clearAuthToken, setAuthToken } from '../../../lib/auth/auth-token';
import type { components } from '../../../lib/api/generated/schema';

export type SetupStatusResponse = components['schemas']['SetupStatusResponseDto'];
export type CurrentUserResponse = components['schemas']['CurrentUserResponseDto'];
export type AuthenticatedUserResponse = components['schemas']['AuthenticatedUserResponseDto'];

export type AuthCredentials = {
  username: string;
  password: string;
};

export async function getSetupStatus(): Promise<SetupStatusResponse> {
  const result = await requestApi(openApiClient.GET('/auth/setup-status'));
  return result.data;
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const result = await requestApi(openApiClient.GET('/auth/current-user'));
  return result.data;
}

export async function login(values: AuthCredentials): Promise<AuthenticatedUserResponse> {
  const result = await requestApi(openApiClient.POST('/auth/login', { body: values } as never));
  const data = result.data as AuthenticatedUserResponse;
  setAuthToken(data.token);
  return data;
}

export async function setupAdmin(values: AuthCredentials): Promise<AuthenticatedUserResponse> {
  const result = await requestApi(
    openApiClient.POST('/auth/setup-admin', { body: values } as never),
  );
  const data = result.data as AuthenticatedUserResponse;
  setAuthToken(data.token);
  return data;
}

export async function logout(): Promise<{ ok?: boolean }> {
  const result = await requestApi(openApiClient.POST('/auth/logout'));
  clearAuthToken();
  return result.data;
}
