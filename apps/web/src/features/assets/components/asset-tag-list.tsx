import { cn } from '../../../lib/utils';

export interface AssetTagListProps {
  tags: string[];
  className?: string;
  maxItems?: number;
}

export function AssetTagList({ tags, className, maxItems = 4 }: AssetTagListProps) {
  const visibleTags = tags.slice(0, maxItems);
  const hiddenCount = Math.max(tags.length - visibleTags.length, 0);

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex min-w-0 flex-wrap gap-1.5', className)}>
      {visibleTags.map((tag) => (
        <span
          className="max-w-full truncate rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground"
          key={tag}
        >
          {tag}
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
          +{hiddenCount}
        </span>
      ) : null}
    </div>
  );
}
