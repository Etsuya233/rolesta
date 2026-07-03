import type { ReactNode } from 'react';
import { cn } from '../../../lib/utils';
import { AssetTagList } from './asset-tag-list';

export interface AssetListItemProps {
  title: string;
  comment?: string;
  tags?: string[];
  meta?: ReactNode;
  avatarLabel?: string;
  className?: string;
  onClick?: () => void;
}

export function AssetListItem({
  title,
  comment,
  tags = [],
  meta,
  avatarLabel,
  className,
  onClick,
}: AssetListItemProps) {
  const content = (
    <>
      <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-sm font-medium text-muted-foreground">
        {avatarLabel ?? title.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex min-w-0 items-start gap-2">
          <h2 className="min-w-0 flex-1 truncate text-sm font-medium">{title}</h2>
          {meta ? <div className="shrink-0 text-xs text-muted-foreground">{meta}</div> : null}
        </div>
        {comment ? <p className="truncate text-sm text-muted-foreground">{comment}</p> : null}
        <AssetTagList tags={tags} />
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        className={cn(
          'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30',
          className,
        )}
        type="button"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return <div className={cn('flex items-start gap-3 border-b border-border px-4 py-3', className)}>{content}</div>;
}
