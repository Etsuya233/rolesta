import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  deletePresetEntry,
  getPreset,
  updatePresetPromptItems,
} from "../api/presets-api";
import { PresetPromptListRow } from "./preset-prompt-list-row";

export function PresetPromptListEditor({
  presetId,
  onCreateEntry,
  onEditEntry,
}: {
  presetId: string;
  onCreateEntry: () => void;
  onEditEntry: (entryId: string) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["preset", presetId],
    queryFn: () => getPreset(presetId),
  });
  const [items, setItems] = useState<Array<{ entryId: string; enabled: boolean }>>([]);
  const [unlinkedSearch, setUnlinkedSearch] = useState("");
  const debouncedUnlinkedSearch = useDebouncedValue(unlinkedSearch, 250);

  useEffect(() => {
    if (query.data) {
      setItems(
        [...query.data.promptItems]
          .sort((left, right) => left.orderIndex - right.orderIndex)
          .map((item) => ({ entryId: item.entryId, enabled: item.enabled })),
      );
    }
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () => updatePresetPromptItems(presetId, items),
    async onSuccess(preset) {
      await queryClient.invalidateQueries({ queryKey: ["presets"] });
      queryClient.setQueryData(["preset", preset.id], preset);
    },
  });
  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => deletePresetEntry(presetId, entryId),
    async onSuccess(preset) {
      await queryClient.invalidateQueries({ queryKey: ["presets"] });
      queryClient.setQueryData(["preset", preset.id], preset);
    },
  });
  const entryById = useMemo(
    () => new Map(query.data?.entries.map((entry) => [entry.id, entry]) ?? []),
    [query.data?.entries],
  );
  const linkedEntryIds = new Set(items.map((item) => item.entryId));
  const unlinkedEntries =
    query.data?.entries.filter((entry) => !linkedEntryIds.has(entry.id)) ?? [];
  const visibleUnlinkedEntries = useMemo(() => {
    const keyword = debouncedUnlinkedSearch.trim().toLocaleLowerCase();

    if (keyword.length === 0) {
      return unlinkedEntries;
    }

    return unlinkedEntries.filter((entry) =>
      entry.name.toLocaleLowerCase().includes(keyword),
    );
  }, [debouncedUnlinkedSearch, unlinkedEntries]);
  const totalTokens = items.reduce((total, item) => {
    const entry = entryById.get(item.entryId);
    return total + (item.enabled ? entry?.tokenCount ?? 0 : 0);
  }, 0);
  function linkEntry(entryId: string) {
    setItems((current) => {
      if (current.some((item) => item.entryId === entryId)) {
        return current;
      }

      return [...current, { entryId, enabled: true }];
    });
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
  );

  if (query.isLoading) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        {t("presets.promptList.loading")}
      </p>
    );
  }

  if (!query.data) {
    return (
      <p className="p-4 text-sm text-destructive">
        {t("presets.promptList.loadFailed")}
      </p>
    );
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">
            {t("presets.metrics.totalTokens")}
          </div>
          <div className="truncate text-lg font-semibold tabular-nums">
            {totalTokens.toLocaleString()}
          </div>
        </div>
        <Button type="button" onClick={onCreateEntry}>
          <Plus aria-hidden="true" />
          {t("presets.promptList.addEntry")}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <DndContext
          autoScroll
          collisionDetection={closestCenter}
          sensors={sensors}
          onDragEnd={(event) => setItemsAfterDrag(event, items, setItems)}
        >
          <SortableContext
            items={items.map((item) => item.entryId)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => {
              const entry = entryById.get(item.entryId);

              if (!entry) {
                return null;
              }

              return (
                <PresetPromptListRow
                  key={item.entryId}
                  enabled={item.enabled}
                  entry={entry}
                  id={item.entryId}
                  tokenCount={entry.tokenCount}
                  onEdit={() => onEditEntry(entry.id)}
                  onToggle={(enabled) =>
                    setItems((current) =>
                      current.map((candidate) =>
                        candidate.entryId === item.entryId
                          ? { ...candidate, enabled }
                          : candidate,
                      ),
                    )
                  }
                  onUnlink={() =>
                    setItems((current) =>
                      current.filter((candidate) => candidate.entryId !== item.entryId),
                    )
                  }
                />
              );
            })}
          </SortableContext>
        </DndContext>

        {unlinkedEntries.length > 0 ? (
          <div className="border-t border-border px-4 py-3">
            <div className="mb-3 flex flex-col gap-2">
              <div className="text-xs font-medium text-muted-foreground">
                {t("presets.promptList.unlinkedEntries")}
              </div>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-label={t("presets.promptList.searchUnlinkedLabel")}
                  className="pl-9"
                  placeholder={t("presets.promptList.searchUnlinkedPlaceholder")}
                  value={unlinkedSearch}
                  onChange={(event) => setUnlinkedSearch(event.target.value)}
                />
              </div>
            </div>
            {visibleUnlinkedEntries.length > 0 ? (
              <div className="flex flex-col gap-2">
                {visibleUnlinkedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid min-h-12 grid-cols-[minmax(0,1fr)_2.25rem_2.25rem_2.25rem] items-center gap-1 rounded-md border border-border px-2 py-2"
                  >
                    <Button
                      className="min-w-0 justify-between px-2"
                      type="button"
                      variant="ghost"
                      onClick={() => linkEntry(entry.id)}
                    >
                      <span className="truncate">{entry.name}</span>
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {entry.tokenCount.toLocaleString()}
                      </span>
                    </Button>
                    <Button
                      aria-label={t("presets.promptList.linkEntryLabel", {
                        name: entry.name,
                      })}
                      className="size-9"
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => linkEntry(entry.id)}
                    >
                      <Plus aria-hidden="true" />
                    </Button>
                    <Button
                      aria-label={t("presets.entries.editAction")}
                      className="size-9"
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => onEditEntry(entry.id)}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      aria-label={t("presets.entries.deleteAction")}
                      className="size-9"
                      disabled={deleteEntryMutation.isPending}
                      size="icon"
                      type="button"
                      variant="destructive"
                      onClick={() => deleteEntryMutation.mutate(entry.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-3 text-sm text-muted-foreground">
                {t("presets.promptList.noUnlinkedMatches")}
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <Button
          className="w-full"
          disabled={saveMutation.isPending}
          type="button"
          onClick={() => saveMutation.mutate()}
        >
          {t("presets.promptList.save")}
        </Button>
      </div>
    </div>
  );
}

function setItemsAfterDrag(
  event: DragEndEvent,
  items: Array<{ entryId: string; enabled: boolean }>,
  setItems: (items: Array<{ entryId: string; enabled: boolean }>) => void,
) {
  const { active, over } = event;

  if (!over || active.id === over.id) {
    return;
  }

  const oldIndex = items.findIndex((item) => item.entryId === active.id);
  const newIndex = items.findIndex((item) => item.entryId === over.id);

  if (oldIndex >= 0 && newIndex >= 0) {
    setItems(arrayMove(items, oldIndex, newIndex));
  }
}

function useDebouncedValue(value: string, delayMs: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}
