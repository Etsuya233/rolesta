import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../../../components/ui/input";
import { getFormErrorMessage } from "../../../lib/forms/form-error";
import { notify } from "../../../lib/notifications/notify";
import { AssetSortMenu } from "../../assets/components/asset-sort-menu";
import { PageControls } from "../../assets/components/page-controls";
import {
  listPresets,
  type PresetSortKey,
  type SortDirection,
} from "../api/presets-api";
import { PresetListItem } from "./preset-list-item";

export function PresetListPanel({
  onSelectPreset,
}: {
  onSelectPreset: (presetId: string) => void;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<PresetSortKey>("createdAt");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const query = useQuery({
    queryKey: ["presets", { q, sort, direction, pageIndex, pageSize }],
    queryFn: () => listPresets({ q, sort, direction, pageIndex, pageSize }),
  });
  const sortOptions: Array<{ value: PresetSortKey; label: string }> = [
    { value: "createdAt", label: t("presets.list.sort.createdAt") },
    { value: "updatedAt", label: t("presets.list.sort.updatedAt") },
    { value: "name", label: t("presets.list.sort.name") },
    { value: "lastUsedAt", label: t("presets.list.sort.lastUsedAt") },
    { value: "usageCount", label: t("presets.list.sort.usageCount") },
  ];

  useEffect(() => {
    if (query.isError) {
      notify.error({ title: getFormErrorMessage(query.error) });
    }
  }, [query.error, query.isError]);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4">
        <Input
          aria-label={t("presets.list.searchLabel")}
          placeholder={t("presets.list.searchPlaceholder")}
          value={q}
          onChange={(event) => {
            setPageIndex(0);
            setQ(event.target.value);
          }}
        />
        <AssetSortMenu
          direction={direction}
          options={sortOptions}
          sort={sort}
          onDirectionChange={(value) => {
            setPageIndex(0);
            setDirection(value);
          }}
          onSortChange={(value) => {
            setPageIndex(0);
            setSort(value);
          }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {query.isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">
            {t("presets.list.loading")}
          </p>
        ) : null}
        {query.data?.items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {t("presets.list.empty")}
          </p>
        ) : null}
        {query.data?.items.map((preset) => (
          <PresetListItem
            key={preset.id}
            preset={preset}
            onSelect={onSelectPreset}
          />
        ))}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <PageControls
          pageIndex={query.data?.pageIndex ?? pageIndex}
          pageSize={query.data?.pageSize ?? pageSize}
          totalPages={query.data?.totalPages ?? 1}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(nextPageSize) => {
            setPageIndex(0);
            setPageSize(nextPageSize);
          }}
        />
      </div>
    </div>
  );
}
