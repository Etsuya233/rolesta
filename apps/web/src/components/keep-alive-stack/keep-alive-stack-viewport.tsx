import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import type { KeepAliveStackPage } from "./use-keep-alive-stack";

export interface KeepAliveStackViewportProps<
  TPage extends KeepAliveStackPage,
> {
  pages: TPage[];
  activeKey: string;
  renderPage: (page: TPage) => ReactNode;
}

export function KeepAliveStackViewport<TPage extends KeepAliveStackPage>({
  pages,
  activeKey,
  renderPage,
}: KeepAliveStackViewportProps<TPage>) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      {pages.map((page, index) => {
        const isActive = page.key === activeKey;

        return (
          <section
            key={page.key}
            aria-hidden={!isActive}
            className={cn(
              "absolute inset-0 min-h-0 overflow-hidden bg-background",
              isActive
                ? "visible pointer-events-auto"
                : "invisible pointer-events-none",
            )}
            inert={!isActive}
            style={{ zIndex: index }}
          >
            {renderPage(page)}
          </section>
        );
      })}
    </div>
  );
}
