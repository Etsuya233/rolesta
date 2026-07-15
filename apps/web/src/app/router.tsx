import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import {
  AppRouteGuard,
  LoginRouteGuard,
  SetupRouteGuard,
} from '../features/auth/routes/auth-route-guards';

const LoginPage = lazy(() =>
  import('../features/auth/routes/login-page').then((module) => ({
    default: module.LoginPage,
  })),
);
const SetupPage = lazy(() =>
  import('../features/auth/routes/setup-page').then((module) => ({
    default: module.SetupPage,
  })),
);
const WorkbenchPage = lazy(() =>
  import('../features/chats/routes/workbench-page').then((module) => ({
    default: module.WorkbenchPage,
  })),
);
const CharactersPage = lazy(() =>
  import('../features/characters/routes/characters-page').then((module) => ({
    default: module.CharactersPage,
  })),
);
const PresetsPage = lazy(() =>
  import('../features/presets/routes/presets-page').then((module) => ({
    default: module.PresetsPage,
  })),
);
const WorldbooksPage = lazy(() =>
  import('../features/worldbooks/routes/worldbooks-page').then((module) => ({
    default: module.WorldbooksPage,
  })),
);
const ModelProvidersPage = lazy(() =>
  import('../features/model-providers/routes/model-providers-page').then((module) => ({
    default: module.ModelProvidersPage,
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
    path: '/app/characters',
    element: (
      <AppRouteGuard>
        <CharactersPage />
      </AppRouteGuard>
    ),
  },
  {
    path: '/app/presets',
    element: (
      <AppRouteGuard>
        <PresetsPage />
      </AppRouteGuard>
    ),
  },
  {
    path: '/app/worldbooks',
    element: (
      <AppRouteGuard>
        <WorldbooksPage />
      </AppRouteGuard>
    ),
  },
  {
    path: '/app/model-providers',
    element: (
      <AppRouteGuard>
        <ModelProvidersPage />
      </AppRouteGuard>
    ),
  },
]);
