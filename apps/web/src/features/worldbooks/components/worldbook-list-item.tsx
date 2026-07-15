import { BookOpenText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../components/ui/badge';
import type { WorldbookSummaryResponse } from '../api/worldbooks-api';

export function WorldbookListItem({
  worldbook,
  onSelect,
}: {
  worldbook: WorldbookSummaryResponse;
  onSelect: (worldbookId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      className="grid w-full grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border px-4 py-3 text-left hover:bg-accent"
      type="button"
      onClick={() => onSelect(worldbook.id)}
    >
      <div className="flex size-10 items-center justify-center rounded-md border border-border bg-muted">
        <BookOpenText aria-hidden="true" className="size-5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-medium">{worldbook.name}</div>
          <Badge className="shrink-0" variant="outline">
            {worldbook.visibility === 'public'
              ? t('worldbooks.list.publicVisibility')
              : t('worldbooks.list.privateVisibility')}
          </Badge>
        </div>
        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {worldbook.description || t('worldbooks.list.noDescription')}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{t('worldbooks.list.entryCount', { count: worldbook.entryCount })}</span>
          <span>
            {t('worldbooks.list.enabledEntryCount', {
              count: worldbook.enabledEntryCount,
            })}
          </span>
          <span>{t('worldbooks.list.tokenCount', { count: worldbook.tokenCount })}</span>
        </div>
      </div>
    </button>
  );
}
