import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

export interface MobileTopBarProps {
  title: string;
  actions?: ReactNode;
  className?: string;
  onBack: () => void;
}

export function MobileTopBar({ title, actions, className, onBack }: MobileTopBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur',
        className,
      )}
    >
      <button
        aria-label="返回"
        className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
        type="button"
        onClick={onBack}
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{title}</h1>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </header>
  );
}
