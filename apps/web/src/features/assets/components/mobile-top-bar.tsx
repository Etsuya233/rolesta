import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../../../components/ui/button';
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
      <Button
        aria-label="返回"
        className="size-10"
        size="icon-lg"
        type="button"
        variant="ghost"
        onClick={onBack}
      >
        <ArrowLeft aria-hidden="true" />
      </Button>
      <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{title}</h1>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </header>
  );
}
