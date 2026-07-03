import { ChevronDown } from 'lucide-react';
import { Collapsible } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

export interface CollapsibleFieldGroupProps {
  title: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export function CollapsibleFieldGroup({
  title,
  children,
  className,
  defaultOpen = false,
}: CollapsibleFieldGroupProps) {
  return (
    <Collapsible.Root className={cn('border-b border-border', className)} defaultOpen={defaultOpen}>
      <Collapsible.Trigger className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30">
        <span className="min-w-0 truncate">{title}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
        />
      </Collapsible.Trigger>
      <Collapsible.Content className="px-4 pb-4">{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}
