import { Badge } from '../../../components/ui/badge';
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
        <Badge className="max-w-full truncate" key={tag} variant="outline">
          {tag}
        </Badge>
      ))}
      {hiddenCount > 0 ? <Badge variant="secondary">+{hiddenCount}</Badge> : null}
    </div>
  );
}
