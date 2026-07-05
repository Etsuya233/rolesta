import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import type { PresetSummaryResponse } from "../api/presets-api";

export function PresetListItem({
  preset,
  onSelect,
}: {
  preset: PresetSummaryResponse;
  onSelect: (presetId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Button
      className="h-auto w-full justify-start rounded-none border-b border-border px-4 py-3 text-left"
      type="button"
      variant="ghost"
      onClick={() => onSelect(preset.id)}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-medium">{preset.name}</span>
        <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            {t("presets.list.tokenCount", {
              count: preset.tokenCount,
              value: preset.tokenCount.toLocaleString(),
            })}
          </span>
          <span>
            {t("presets.list.entryCount", {
              count: preset.entryCount,
              value: preset.entryCount.toLocaleString(),
            })}
          </span>
          <span>
            {t("presets.list.usageCount", {
              count: preset.usageCount,
              value: preset.usageCount.toLocaleString(),
            })}
          </span>
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </Button>
  );
}
