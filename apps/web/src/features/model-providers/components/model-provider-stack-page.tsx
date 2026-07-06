import type { ReactNode } from "react";

export function ModelProviderStackPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      {children}
    </div>
  );
}
