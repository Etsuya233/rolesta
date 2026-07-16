import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Link2Off, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { cn } from '../../../lib/utils';
import type { PresetDocumentPromptItem } from '../api/presets-api';

export function PresetPromptListRow({
  item,
  label,
  tokenCount,
  onEdit,
  onToggle,
  onUnlink,
  disabled,
}: {
  item: PresetDocumentPromptItem;
  label: string;
  tokenCount: number;
  onEdit?: () => void;
  onToggle: (enabled: boolean) => void;
  onUnlink?: () => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const [isConfirmingUnlink, setIsConfirmingUnlink] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  useEffect(() => {
    if (!isConfirmingUnlink) {
      return;
    }
    const timeoutId = window.setTimeout(() => setIsConfirmingUnlink(false), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [isConfirmingUnlink]);

  function unlinkAfterConfirmation() {
    if (!isConfirmingUnlink) {
      setIsConfirmingUnlink(true);
      return;
    }
    setIsConfirmingUnlink(false);
    onUnlink?.();
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'grid min-h-14 grid-cols-[2.25rem_minmax(0,1fr)_6rem_2.25rem_2.25rem_minmax(3.75rem,auto)] items-center gap-1 border-b border-border px-2 py-2',
        isDragging && 'relative z-10 bg-muted shadow-sm',
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <Button
        aria-label={t('presets.promptList.dragLabel')}
        className="size-9 touch-none cursor-grab select-none"
        disabled={disabled}
        size="icon"
        type="button"
        variant="ghost"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" />
      </Button>
      <span className="min-w-0 truncate text-sm font-medium">{label}</span>
      {item.kind === 'customPrompt' ? (
        <span aria-hidden="true" />
      ) : (
        <Badge className="justify-self-start" variant="secondary">
          {t(`presets.promptList.kinds.${item.kind}`)}
        </Badge>
      )}
      {onUnlink ? (
        <Button
          aria-label={t(
            isConfirmingUnlink
              ? 'presets.promptList.confirmUnlinkLabel'
              : 'presets.promptList.unlinkLabel',
          )}
          className="size-9"
          disabled={disabled}
          size="icon"
          type="button"
          variant={isConfirmingUnlink ? 'destructive' : 'ghost'}
          onClick={unlinkAfterConfirmation}
        >
          <Link2Off aria-hidden="true" />
        </Button>
      ) : (
        <span aria-hidden="true" className="size-9" />
      )}
      {onEdit ? (
        <Button
          aria-label={t(
            item.kind === 'customPrompt'
              ? 'presets.entries.editAction'
              : 'presets.systemItems.editAction',
          )}
          className="size-9"
          disabled={disabled}
          size="icon"
          type="button"
          variant="ghost"
          onClick={onEdit}
        >
          <Pencil aria-hidden="true" />
        </Button>
      ) : (
        <span aria-hidden="true" className="size-9" />
      )}
      <div className="flex min-w-0 items-center justify-end gap-3">
        <Checkbox
          aria-label={t('presets.promptList.enableLabel')}
          checked={item.enabled}
          disabled={disabled}
          onCheckedChange={(checked) => onToggle(checked === true)}
        />
        <span className="min-w-12 truncate text-right text-xs tabular-nums text-muted-foreground">
          {tokenCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
