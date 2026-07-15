import type { ReactNode } from 'react';
import {
  workspacePanelByKey,
  type WorkspaceArea,
  type WorkspacePanelKey,
  type WorkspacePanelRuntime,
} from '../model/workspace-panels';
import { cn } from '../../../lib/utils';

interface WorkspacePanelHostProps {
  area: WorkspaceArea;
  openedKeys: WorkspacePanelKey[];
  activeKey: WorkspacePanelKey | null;
  runtime: WorkspacePanelRuntime;
  emptyState?: ReactNode;
  className?: string;
}

export function WorkspacePanelHost({
  area,
  openedKeys,
  activeKey,
  runtime,
  emptyState,
  className,
}: WorkspacePanelHostProps) {
  if (openedKeys.length === 0) {
    return <div className={cn('h-full min-h-0', className)}>{emptyState}</div>;
  }

  return (
    <div className={cn('relative isolate h-full min-h-0 overflow-hidden', className)}>
      {openedKeys.map((panelKey) => {
        const panel = workspacePanelByKey(panelKey);

        if (!panel) {
          return null;
        }

        const PanelComponent = panel.Component;
        const active = panelKey === activeKey;

        return (
          <section
            key={`${area}:${panel.key}`}
            aria-hidden={!active}
            inert={!active}
            data-testid={`workspace-panel-${area}-${panel.key}`}
            className={cn(
              'absolute inset-0 min-h-0 overflow-hidden [&>main]:h-full [&>main]:min-h-0',
              active ? 'z-10 opacity-100 pointer-events-auto' : 'z-0 opacity-0 pointer-events-none',
            )}
          >
            <PanelComponent {...runtime} />
          </section>
        );
      })}
    </div>
  );
}
