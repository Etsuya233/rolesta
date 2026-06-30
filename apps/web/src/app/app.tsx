import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers';
import { router } from './router';

export function App() {
  return (
    <AppProviders>
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  );
}
