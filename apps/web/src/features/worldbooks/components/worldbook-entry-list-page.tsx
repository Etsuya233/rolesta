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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import {
  deleteWorldbookEntry,
  getWorldbook,
  updateWorldbookEntryOrder,
  type WorldbookEntryResponse,
} from "../api/worldbooks-api";
import {
  type WorldbookPage,
  worldbookEntryCreatePage,
  worldbookEntryEditPage,
} from "./worldbook-pages";
import { WorldbookStackPage } from "./worldbook-stack-page";

export function WorldbookEntryListPage({
  page,
  pushPage,
  onBack,
}: {
  page: Extract<WorldbookPage, { name: "entryList" }>;
  pushPage: (page: WorldbookPage) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  return (
    <WorldbookStackPage>
      <MobileTopBar title={t("worldbooks.entries.title")} onBack={onBack} />
      <WorldbookEntryListEditor
        worldbookId={page.worldbookId}
        onCreateEntry={() =>
          pushPage(worldbookEntryCreatePage(page.worldbookId, page.sessionKey))
        }
        onEditEntry={(entryId) =>
          pushPage(
            worldbookEntryEditPage(page.worldbookId, entryId, page.sessionKey),
          )
        }
      />
    </WorldbookStackPage>
  );
}

function WorldbookEntryListEditor({
  worldbookId,
  onCreateEntry,
  onEditEntry,
}: {
  worldbookId: string;
  onCreateEntry: () => void;
  onEditEntry: (entryId: string) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["worldbook", worldbookId],
    queryFn: () => getWorldbook(worldbookId),
  });
  const [items, setItems] = useState<
    Array<{ entryId: string; enabled: boolean }>
  >([]);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 200);

  useEffect(() => {
    if (query.data) {
      setItems(
        [...query.data.entries]
          .sort((left, right) => left.displayOrder - right.displayOrder)
          .map((entry) => ({ entryId: entry.id, enabled: entry.enabled })),
      );
    }
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () => updateWorldbookEntryOrder(worldbookId, items),
    async onSuccess(worldbook) {
      await queryClient.invalidateQueries({ queryKey: ["worldbooks"] });
      queryClient.setQueryData(["worldbook", worldbook.id], worldbook);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => deleteWorldbookEntry(worldbookId, entryId),
    async onSuccess(worldbook) {
      await queryClient.invalidateQueries({ queryKey: ["worldbooks"] });
      queryClient.setQueryData(["worldbook", worldbook.id], worldbook);
    },
  });
  const entryById = useMemo(
    () => new Map(query.data?.entries.map((entry) => [entry.id, entry]) ?? []),
    [query.data?.entries],
  );
  const keyword = debouncedQ.trim().toLocaleLowerCase();
  const visibleItems = items.filter((item) => {
    const entry = entryById.get(item.entryId);
    if (!entry || keyword.length === 0) {
      return Boolean(entry);
    }

    return (
      entry.name.toLocaleLowerCase().includes(keyword) ||
      entry.content.toLocaleLowerCase().includes(keyword) ||
      entry.primaryKeys.some((key) =>
        key.toLocaleLowerCase().includes(keyword),
      ) ||
      entry.secondaryKeys.some((key) =>
        key.toLocaleLowerCase().includes(keyword),
      )
    );
  });
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
  );

  if (query.isLoading) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        {t("worldbooks.entries.loading")}
      </p>
    );
  }

  if (!query.data) {
    return (
      <p className="p-4 text-sm text-destructive">
        {t("worldbooks.entries.loadFailed")}
      </p>
    );
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label={t("worldbooks.entries.searchLabel")}
              className="pl-9"
              placeholder={t("worldbooks.entries.searchPlaceholder")}
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <Button type="button" onClick={onCreateEntry}>
            <Plus aria-hidden="true" />
            {t("worldbooks.entries.createAction")}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {t("worldbooks.entries.empty")}
          </p>
        ) : null}
        <DndContext
          autoScroll
          collisionDetection={closestCenter}
          sensors={sensors}
          onDragEnd={(event) => setItemsAfterDrag(event, items, setItems)}
        >
          <SortableContext
            items={visibleItems.map((item) => item.entryId)}
            strategy={verticalListSortingStrategy}
          >
            {visibleItems.map((item) => {
              const entry = entryById.get(item.entryId);

              if (!entry) {
                return null;
              }

              return (
                <WorldbookEntryRow
                  key={item.entryId}
                  enabled={item.enabled}
                  entry={entry}
                  id={item.entryId}
                  onDelete={() => deleteMutation.mutate(entry.id)}
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
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <Button
          className="w-full"
          disabled={saveMutation.isPending}
          type="button"
          onClick={() => saveMutation.mutate()}
        >
          {t("worldbooks.entries.saveOrder")}
        </Button>
      </div>
    </div>
  );
}

function WorldbookEntryRow({
  id,
  entry,
  enabled,
  onToggle,
  onEdit,
  onDelete,
}: {
  id: string;
  entry: WorldbookEntryResponse;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className="grid min-h-16 grid-cols-[2rem_minmax(0,1fr)_2.5rem_2.5rem_2.5rem] items-center gap-1 border-b border-border px-3 py-2"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <Button
        aria-label={t("worldbooks.entries.dragLabel")}
        className="size-8 touch-none"
        size="icon"
        type="button"
        variant="ghost"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" />
      </Button>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{entry.name}</div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{entry.tokenCount.toLocaleString()}</span>
          <span>
            {t(`worldbooks.entries.positions.${entry.insertionPosition}`)}
          </span>
          <span>{entry.primaryKeys.slice(0, 3).join(", ")}</span>
        </div>
      </div>
      <label className="flex size-10 items-center justify-center">
        <input
          checked={enabled}
          className="size-4 accent-primary"
          type="checkbox"
          aria-label={t("worldbooks.entries.enableLabel")}
          onChange={(event) => onToggle(event.target.checked)}
        />
      </label>
      <Button
        aria-label={t("worldbooks.entries.editAction")}
        className="size-10"
        size="icon"
        type="button"
        variant="ghost"
        onClick={onEdit}
      >
        <Pencil aria-hidden="true" />
      </Button>
      <Button
        aria-label={t("worldbooks.entries.deleteAction")}
        className="size-10"
        size="icon"
        type="button"
        variant="ghost"
        onClick={onDelete}
      >
        <Trash2 aria-hidden="true" />
      </Button>
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
    const timeoutId = window.setTimeout(
      () => setDebouncedValue(value),
      delayMs,
    );
    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}
