import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser, useSetupStatus } from '../hooks/use-current-user';

export function SetupRouteGuard({ children }: PropsWithChildren) {
  const setupStatus = useSetupStatus();
  const shouldCheckUser = setupStatus.data?.requiresSetup === false;
  const currentUser = useCurrentUser({ enabled: shouldCheckUser });

  if (setupStatus.isPending || (shouldCheckUser && currentUser.isPending)) {
    return <AuthRouteLoading />;
  }

  if (setupStatus.data?.requiresSetup) {
    return children;
  }

  if (currentUser.data?.user) {
    return <Navigate to="/app" replace />;
  }

  return <Navigate to="/login" replace />;
}

export function LoginRouteGuard({ children }: PropsWithChildren) {
  const setupStatus = useSetupStatus();

  if (setupStatus.isPending) {
    return <AuthRouteLoading />;
  }

  if (setupStatus.data?.requiresSetup) {
    return <Navigate to="/setup" replace />;
  }

  return children;
}

export function AppRouteGuard({ children }: PropsWithChildren) {
  const setupStatus = useSetupStatus();
  const shouldCheckUser = setupStatus.data?.requiresSetup === false;
  const currentUser = useCurrentUser({ enabled: shouldCheckUser });

  if (setupStatus.isPending || (shouldCheckUser && currentUser.isPending)) {
    return <AuthRouteLoading />;
  }

  if (setupStatus.data?.requiresSetup) {
    return <Navigate to="/setup" replace />;
  }

  if (!currentUser.data?.user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AuthRouteLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-background text-foreground">
      <div className="h-8 w-8 rounded-full border border-muted-foreground/20 border-t-foreground" />
    </main>
  );
}
