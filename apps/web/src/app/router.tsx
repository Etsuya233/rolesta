import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import {
  AppRouteGuard,
  LoginRouteGuard,
  SetupRouteGuard,
} from '../features/auth/routes/auth-route-guards';

const LoginPage = lazy(() =>
  import('../features/auth/routes/login-page').then((module) => ({ default: module.LoginPage })),
);
const SetupPage = lazy(() =>
  import('../features/auth/routes/setup-page').then((module) => ({ default: module.SetupPage })),
);
const WorkbenchPage = lazy(() =>
  import('../features/chats/routes/workbench-page').then((module) => ({
    default: module.WorkbenchPage,
  })),
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app" replace />,
  },
  {
    path: '/setup',
    element: (
      <SetupRouteGuard>
        <SetupPage />
      </SetupRouteGuard>
    ),
  },
  {
    path: '/login',
    element: (
      <LoginRouteGuard>
        <LoginPage />
      </LoginRouteGuard>
    ),
  },
  {
    path: '/app',
    element: (
      <AppRouteGuard>
        <WorkbenchPage />
      </AppRouteGuard>
    ),
  },
  {
    path: '/app/chats/:chatId',
    element: (
      <AppRouteGuard>
        <WorkbenchPage />
      </AppRouteGuard>
    ),
  },
]);
