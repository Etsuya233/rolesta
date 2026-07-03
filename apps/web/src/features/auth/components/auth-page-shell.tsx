import type { PropsWithChildren, ReactNode } from 'react';

type AuthPageShellProps = PropsWithChildren<{
  header?: ReactNode;
  showBrandPanel?: boolean;
}>;

export function AuthPageShell({ children, header, showBrandPanel = true }: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div
        className={
          showBrandPanel
            ? 'grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_460px]'
            : 'grid min-h-screen place-items-center'
        }
      >
        {showBrandPanel ? (
          <section className="hidden border-r bg-muted/30 lg:block">
            <div className="flex h-full flex-col justify-between p-10">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Rolesta
              </div>
              <div className="grid grid-cols-6 gap-2 opacity-80">
                {Array.from({ length: 24 }).map((_, index) => (
                  <span className="aspect-square rounded-md border bg-background" key={index} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
        <section className="flex min-h-screen items-center justify-center px-6 py-10">
          <div className="w-full max-w-[360px]">
            {header}
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
