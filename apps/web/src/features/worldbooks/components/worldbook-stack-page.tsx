import type { ReactNode } from 'react';

export function WorldbookStackPage({ children }: { children: ReactNode }) {
  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden">{children}</section>
  );
}
