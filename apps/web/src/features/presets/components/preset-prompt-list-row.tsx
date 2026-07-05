import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Link2Off, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";
import type { PresetEntryResponse } from "../api/presets-api";

export function PresetPromptListRow({
  id,
  entry,
  enabled,
  tokenCount,
  onEdit,
  onToggle,
  onUnlink,
}: {
  id: string;
  entry: PresetEntryResponse;
  enabled: boolean;
  tokenCount: number;
  onEdit: () => void;
  onToggle: (enabled: boolean) => void;
  onUnlink: () => void;
}) {
  const { t } = useTranslation();
  const [isConfirmingUnlink, setIsConfirmingUnlink] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

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
    onUnlink();
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "grid min-h-12 grid-cols-[2.25rem_minmax(0,1fr)_2.25rem_2.25rem_2.75rem_minmax(3.75rem,auto)] items-center gap-1 border-b border-border px-2 py-2",
        isDragging && "relative z-10 bg-muted shadow-sm",
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Button
        aria-label={t("presets.promptList.dragLabel")}
        className="size-9 touch-none cursor-grab select-none"
        size="icon"
        type="button"
        variant="ghost"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" />
      </Button>
      <span className="min-w-0 truncate text-sm font-medium">{entry.name}</span>
      <Button
        aria-label={t(
          isConfirmingUnlink
            ? "presets.promptList.confirmUnlinkLabel"
            : "presets.promptList.unlinkLabel",
        )}
        className="size-9"
        size="icon"
        type="button"
        variant={isConfirmingUnlink ? "destructive" : "ghost"}
        onClick={unlinkAfterConfirmation}
      >
        <Link2Off aria-hidden="true" />
      </Button>
      <Button
        aria-label={t("presets.entries.editAction")}
        className="size-9"
        size="icon"
        type="button"
        variant="ghost"
        onClick={onEdit}
      >
        <Pencil aria-hidden="true" />
      </Button>
      <label className="flex h-9 items-center justify-center">
        <input
          aria-label={t("presets.promptList.enableLabel")}
          checked={enabled}
          className="size-4 accent-primary"
          type="checkbox"
          onChange={(event) => onToggle(event.target.checked)}
        />
      </label>
      <span className="truncate text-right text-xs tabular-nums text-muted-foreground">
        {tokenCount.toLocaleString()}
      </span>
    </div>
  );
}
