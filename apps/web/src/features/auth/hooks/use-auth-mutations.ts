import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, logout, setupAdmin, type AuthCredentials } from '../api/auth-api';
import { currentUserQueryKey, setupStatusQueryKey } from './use-current-user';

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: AuthCredentials) => login(values),
    async onSuccess(data) {
      queryClient.setQueryData(currentUserQueryKey, { user: data.user });
      await queryClient.invalidateQueries({ queryKey: setupStatusQueryKey });
    },
  });
}

export function useSetupAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: AuthCredentials) => setupAdmin(values),
    onSuccess(data) {
      queryClient.setQueryData(currentUserQueryKey, { user: data.user });
      queryClient.setQueryData(setupStatusQueryKey, { requiresSetup: false });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    async onSuccess() {
      queryClient.setQueryData(currentUserQueryKey, { user: null });
      await queryClient.invalidateQueries({ queryKey: setupStatusQueryKey });
    },
  });
}
