import type { ReactNode } from "react";

export function PresetStackPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      {children}
    </div>
  );
}
