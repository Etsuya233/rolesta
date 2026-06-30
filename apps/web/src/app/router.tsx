import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

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
    element: <SetupPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: <WorkbenchPage />,
  },
  {
    path: '/app/chats/:chatId',
    element: <WorkbenchPage />,
  },
]);
