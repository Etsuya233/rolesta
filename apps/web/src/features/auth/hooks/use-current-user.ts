import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getSetupStatus } from '../api/auth-api';

export const currentUserQueryKey = ['auth', 'current-user'] as const;
export const setupStatusQueryKey = ['auth', 'setup-status'] as const;

type AuthQueryOptions = {
  enabled?: boolean;
};

export function useCurrentUser(options: AuthQueryOptions = {}) {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    enabled: options.enabled ?? true,
  });
}

export function useSetupStatus() {
  return useQuery({
    queryKey: setupStatusQueryKey,
    queryFn: getSetupStatus,
  });
}
