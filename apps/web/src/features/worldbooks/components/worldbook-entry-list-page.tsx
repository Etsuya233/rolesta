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
import { countPromptTokens } from "@rolesta/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  GripVertical,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { getFormErrorMessage } from "../../../lib/forms/form-error";
import { notify } from "../../../lib/notifications/notify";
import { cn } from "../../../lib/utils";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import {
  getWorldbook,
  listWorldbooks,
  updateWorldbookDocument,
  type WorldbookDocument,
  type WorldbookInsertionPosition,
  type WorldbookSummaryResponse,
} from "../api/worldbooks-api";
import { useWorldbookDraftSession } from "../hooks/use-worldbook-draft-sessions";
import { worldbookDocumentFromDetail } from "../model/worldbook-editor-form";
import {
  type WorldbookPage,
  worldbookEntryCreatePage,
  worldbookEntryEditPage,
} from "./worldbook-pages";
import { WorldbookStackPage } from "./worldbook-stack-page";

type TranslationFunction = ReturnType<typeof useTranslation>["t"];

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
        sessionKey={page.sessionKey}
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
  sessionKey,
  onCreateEntry,
  onEditEntry,
}: {
  worldbookId: string;
  sessionKey: string;
  onCreateEntry: () => void;
  onEditEntry: (entryId: string) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const {
    document,
    setDocument,
    isPending,
    worldbook,
    acceptSavedWorldbook,
    saveDocument,
  } = useWorldbookDraftSession({ worldbookId, sessionKey });
  const worldbooksQuery = useQuery({
    queryKey: ["worldbooks", "entry-move-targets"],
    queryFn: () =>
      listWorldbooks({
        direction: "asc",
        pageIndex: 0,
        pageSize: 100,
        q: "",
        sort: "name",
      }),
  });
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 200);
  const items = document.entries.map((entry) => ({
    entryId: entry.id,
    enabled: entry.enabled,
  }));
  const moveMutation = useMutation({
    async mutationFn({
      entry,
      targetWorldbookId,
    }: {
      entry: WorldbookDocument["entries"][number];
      targetWorldbookId: string;
    }) {
      const targetCurrent = await getWorldbook(targetWorldbookId);
      const targetDocument = worldbookDocumentFromDetail(targetCurrent);
      const targetWorldbook = await updateWorldbookDocument(targetWorldbookId, {
        ...targetDocument,
        entries: [
          ...targetDocument.entries,
          { ...entry, id: crypto.randomUUID() },
        ],
      });
      const sourceWorldbook = await updateWorldbookDocument(worldbookId, {
        ...document,
        entries: document.entries.filter(
          (candidate) => candidate.id !== entry.id,
        ),
      });

      return { sourceWorldbook, targetWorldbook };
    },
    async onSuccess({ sourceWorldbook, targetWorldbook }) {
      await queryClient.invalidateQueries({ queryKey: ["worldbooks"] });
      queryClient.setQueryData(
        ["worldbook", sourceWorldbook.id],
        sourceWorldbook,
      );
      queryClient.setQueryData(
        ["worldbook", targetWorldbook.id],
        targetWorldbook,
      );
      acceptSavedWorldbook(sourceWorldbook);
    },
    onError(error) {
      notify.error({ title: getFormErrorMessage(error) });
    },
  });
  useEffect(() => {
    if (worldbooksQuery.isError) {
      notify.error({ title: getFormErrorMessage(worldbooksQuery.error) });
    }
  }, [worldbooksQuery.error, worldbooksQuery.isError]);
  const entryById = useMemo(
    () => new Map(document.entries.map((entry) => [entry.id, entry])),
    [document.entries],
  );
  const ownerUserId = worldbook?.ownerUserId;
  const moveTargetWorldbooks =
    worldbooksQuery.data?.items.filter(
      (candidate) =>
        candidate.id !== worldbookId && candidate.ownerUserId === ownerUserId,
    ) ?? [];
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

  if (isPending && !worldbook) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        {t("worldbooks.entries.loading")}
      </p>
    );
  }

  if (!worldbook) {
    return <div className="flex min-h-0 flex-1" />;
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

      <div className="min-h-0 flex-1 overflow-y-auto pb-24">
        {items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {t("worldbooks.entries.empty")}
          </p>
        ) : null}
        <DndContext
          autoScroll
          collisionDetection={closestCenter}
          sensors={sensors}
          onDragEnd={(event) =>
            setEntriesAfterDrag(event, document.entries, (entries) =>
              setDocument((current) => ({ ...current, entries })),
            )
          }
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
                  onDelete={() =>
                    saveDocument({
                      ...document,
                      entries: document.entries.filter(
                        (candidate) => candidate.id !== entry.id,
                      ),
                    })
                  }
                  onEdit={() => onEditEntry(entry.id)}
                  onCopy={() =>
                    saveDocument({
                      ...document,
                      entries: [
                        ...document.entries,
                        { ...entry, id: crypto.randomUUID() },
                      ],
                    })
                  }
                  onMove={(targetWorldbookId) =>
                    moveMutation.mutate({ entry, targetWorldbookId })
                  }
                  onToggleTriggerMode={() =>
                    setDocument((current) => ({
                      ...current,
                      entries: current.entries.map((candidate) =>
                        candidate.id === entry.id
                          ? {
                              ...candidate,
                              constant: !candidate.constant,
                              vectorized: false,
                            }
                          : candidate,
                      ),
                    }))
                  }
                  onToggle={(enabled) =>
                    setDocument((current) => ({
                      ...current,
                      entries: current.entries.map((candidate) =>
                        candidate.id === item.entryId
                          ? { ...candidate, enabled }
                          : candidate,
                      ),
                    }))
                  }
                  pending={isPending || moveMutation.isPending}
                  moveTargetWorldbooks={moveTargetWorldbooks}
                />
              );
            })}
          </SortableContext>
        </DndContext>
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
  onCopy,
  onMove,
  onToggleTriggerMode,
  onDelete,
  pending,
  moveTargetWorldbooks,
}: {
  id: string;
  entry: WorldbookDocument["entries"][number];
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onCopy: () => void;
  onMove: (targetWorldbookId: string) => void;
  onToggleTriggerMode: () => void;
  onDelete: () => void;
  pending: boolean;
  moveTargetWorldbooks: WorldbookSummaryResponse[];
}) {
  const { t } = useTranslation();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [targetWorldbookId, setTargetWorldbookId] = useState("");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const insertionSummary = worldbookEntryInsertionSummary(entry, t);
  const triggerMode = entry.constant ? "green" : "blue";

  useEffect(() => {
    if (!isConfirmingDelete) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => setIsConfirmingDelete(false),
      2500,
    );
    return () => window.clearTimeout(timeoutId);
  }, [isConfirmingDelete]);

  useEffect(() => {
    if (
      targetWorldbookId.length > 0 &&
      !moveTargetWorldbooks.some(
        (worldbook) => worldbook.id === targetWorldbookId,
      )
    ) {
      setTargetWorldbookId("");
    }
  }, [moveTargetWorldbooks, targetWorldbookId]);

  function deleteAfterConfirmation(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }

    setIsConfirmingDelete(false);
    onDelete();
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onEdit();
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-b border-border",
        isDragging && "relative z-10 bg-muted shadow-sm",
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div
        className="grid min-h-16 cursor-pointer grid-cols-[2rem_minmax(0,1fr)_2.5rem_2.5rem_2.5rem_2.5rem] items-center gap-1 px-3 py-2"
        role="button"
        tabIndex={0}
        onClick={onEdit}
        onKeyDown={handleRowKeyDown}
      >
        <Button
          aria-label={t("worldbooks.entries.dragLabel")}
          className="size-8 touch-none"
          size="icon"
          type="button"
          variant="ghost"
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" />
        </Button>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{entry.name}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{countPromptTokens(entry.content).toLocaleString()}</span>
            <span>{insertionSummary}</span>
            <span>{entry.primaryKeys.slice(0, 3).join(", ")}</span>
          </div>
        </div>
        <Button
          aria-label={t(`worldbooks.entries.triggerModes.${triggerMode}`)}
          className="size-10"
          disabled={pending}
          size="icon"
          type="button"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            onToggleTriggerMode();
          }}
        >
          <span aria-hidden="true" className="text-base leading-none">
            {triggerMode === "green" ? "🟢" : "🔵"}
          </span>
        </Button>
        <label
          className="flex size-10 items-center justify-center"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            checked={enabled}
            className="size-4 accent-primary"
            type="checkbox"
            aria-label={t("worldbooks.entries.enableLabel")}
            onChange={(event) => onToggle(event.target.checked)}
          />
        </label>
        <Button
          aria-label={t("worldbooks.entries.menuAction")}
          aria-expanded={isMenuOpen}
          className="size-10"
          size="icon"
          type="button"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            setIsMenuOpen((value) => !value);
          }}
        >
          <MoreVertical aria-hidden="true" />
        </Button>
        <Button
          aria-label={t(
            isConfirmingDelete
              ? "worldbooks.entries.confirmDeleteAction"
              : "worldbooks.entries.deleteAction",
          )}
          className="size-10"
          disabled={pending}
          size="icon"
          type="button"
          variant={isConfirmingDelete ? "destructive" : "ghost"}
          onClick={deleteAfterConfirmation}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      {isMenuOpen ? (
        <div className="grid gap-2 border-t border-border bg-muted/30 px-4 py-3">
          <Button
            className="justify-start"
            disabled={pending}
            type="button"
            variant="ghost"
            onClick={onCopy}
          >
            <Copy aria-hidden="true" />
            {t("worldbooks.entries.copyAction")}
          </Button>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Select
              value={targetWorldbookId}
              onValueChange={setTargetWorldbookId}
            >
              <SelectTrigger
                aria-label={t("worldbooks.entries.moveTargetLabel")}
                className="w-full"
              >
                <SelectValue
                  placeholder={t("worldbooks.entries.moveTargetPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {moveTargetWorldbooks.map((worldbook) => (
                    <SelectItem key={worldbook.id} value={worldbook.id}>
                      {worldbook.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              disabled={pending || targetWorldbookId.length === 0}
              type="button"
              variant="outline"
              onClick={() => onMove(targetWorldbookId)}
            >
              {t("worldbooks.entries.moveAction")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function worldbookEntryInsertionSummary(
  entry: WorldbookDocument["entries"][number],
  t: TranslationFunction,
): string {
  const position: WorldbookInsertionPosition = entry.insertionPosition;
  const positionLabel = t(`worldbooks.entries.positions.${position}`);

  if (entry.insertionPosition === "atDepth") {
    return t("worldbooks.entries.insertionSummary.atDepth", {
      position: positionLabel,
      depth: entry.depth,
      role: t(`worldbooks.entries.roles.${entry.insertionRole}`),
    });
  }

  if (entry.insertionPosition === "atAnchor" && entry.anchorName.length > 0) {
    return t("worldbooks.entries.insertionSummary.atAnchor", {
      position: positionLabel,
      anchor: entry.anchorName,
    });
  }

  return positionLabel;
}

function setEntriesAfterDrag(
  event: DragEndEvent,
  entries: WorldbookDocument["entries"],
  setEntries: (entries: WorldbookDocument["entries"]) => void,
) {
  const { active, over } = event;

  if (!over || active.id === over.id) {
    return;
  }

  const oldIndex = entries.findIndex((entry) => entry.id === active.id);
  const newIndex = entries.findIndex((entry) => entry.id === over.id);

  if (oldIndex >= 0 && newIndex >= 0) {
    setEntries(arrayMove(entries, oldIndex, newIndex));
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
