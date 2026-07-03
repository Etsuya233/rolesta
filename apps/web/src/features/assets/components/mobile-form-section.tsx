import type { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

export interface MobileFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function MobileFormSection({
  title,
  description,
  children,
  className,
}: MobileFormSectionProps) {
  return (
    <section className={cn('space-y-3 px-4 py-4', className)}>
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
