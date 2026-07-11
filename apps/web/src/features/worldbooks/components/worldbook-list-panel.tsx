import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../../../components/ui/input";
import { getFormErrorMessage } from "../../../lib/forms/form-error";
import { notify } from "../../../lib/notifications/notify";
import { AssetPermissionFilterMenu } from "../../assets/components/asset-permission-filter-menu";
import { AssetSortMenu } from "../../assets/components/asset-sort-menu";
import { PageControls } from "../../assets/components/page-controls";
import {
  listWorldbooks,
  type SortDirection,
  type WorldbookListScope,
  type WorldbookSortKey,
} from "../api/worldbooks-api";
import { WorldbookListItem } from "./worldbook-list-item";

export function WorldbookListPanel({
  onSelectWorldbook,
}: {
  onSelectWorldbook: (worldbookId: string) => void;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<WorldbookListScope>("all");
  const [sort, setSort] = useState<WorldbookSortKey>("updatedAt");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const query = useQuery({
    queryKey: [
      "worldbooks",
      { q, scope, sort, direction, pageIndex, pageSize },
    ],
    queryFn: () =>
      listWorldbooks({ q, scope, sort, direction, pageIndex, pageSize }),
  });
  useEffect(() => {
    if (query.isError) {
      notify.error({ title: getFormErrorMessage(query.error) });
    }
  }, [query.error, query.isError]);
  const sortOptions: Array<{ value: WorldbookSortKey; label: string }> = [
    { value: "createdAt", label: t("worldbooks.list.sort.createdAt") },
    { value: "updatedAt", label: t("worldbooks.list.sort.updatedAt") },
    { value: "name", label: t("worldbooks.list.sort.name") },
    { value: "lastUsedAt", label: t("worldbooks.list.sort.lastUsedAt") },
    { value: "usageCount", label: t("worldbooks.list.sort.usageCount") },
  ];

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Input
            aria-label={t("worldbooks.list.searchLabel")}
            className="min-w-0 flex-1"
            placeholder={t("worldbooks.list.searchPlaceholder")}
            value={q}
            onChange={(event) => {
              setPageIndex(0);
              setQ(event.target.value);
            }}
          />
          <AssetPermissionFilterMenu
            buttonLabel={t("worldbooks.list.filterButton")}
            scope={scope}
            onScopeChange={(value) => {
              setPageIndex(0);
              setScope(value);
            }}
          />
        </div>
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
            {t("worldbooks.list.loading")}
          </p>
        ) : null}
        {query.data?.items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {t("worldbooks.list.empty")}
          </p>
        ) : null}
        {query.data?.items.map((worldbook) => (
          <WorldbookListItem
            key={worldbook.id}
            worldbook={worldbook}
            onSelect={onSelectWorldbook}
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
