import { Inject, Injectable } from "@nestjs/common";
import type {
  Database,
  WorldbookEntriesTable,
  WorldbooksTable,
} from "@rolesta/db";
import { getTotalPages, type PageResponse } from "@rolesta/shared";
import type {
  Insertable,
  Kysely,
  Selectable,
  SelectQueryBuilder,
} from "kysely";
import { ensureEpochMillis } from "../../characters/domain/epoch-millis.js";
import { KYSELY_DB } from "../../database/database.provider.js";
import type {
  ListWorldbooksRequest,
  WorldbookSortKey,
  WorldbookStore,
} from "../application/worldbook-store.js";
import type {
  Worldbook,
  WorldbookCharacterFilter,
  WorldbookGenerationTrigger,
  WorldbookEntry,
  WorldbookSummary,
} from "../domain/worldbook.js";

@Injectable()
export class KyselyWorldbookStore implements WorldbookStore {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async list(
    request: ListWorldbooksRequest,
  ): Promise<PageResponse<WorldbookSummary>> {
    const countRow = await withListFilters(
      this.db.selectFrom("worldbooks"),
      request,
    )
      .select((builder) => builder.fn.countAll<number>().as("count"))
      .executeTakeFirstOrThrow();
    const rows = await withListFilters(
      this.db.selectFrom("worldbooks"),
      request,
    )
      .select([
        "id",
        "owner_user_id",
        "visibility",
        "name",
        "description",
        "tags_json",
        "scan_depth",
        "token_budget",
        "recursive_scan",
        "created_at_ms",
        "updated_at_ms",
        "last_used_at_ms",
        "usage_count",
      ])
      .orderBy(sortColumns[request.sort], request.direction)
      .orderBy("id", "asc")
      .limit(request.pageSize)
      .offset(request.pageIndex * request.pageSize)
      .execute();
    const stats = await this.summaryStats(rows.map((row) => row.id));
    const totalItems = Number(countRow.count);

    return {
      items: rows.map((row) => toWorldbookSummary(row, stats.get(row.id))),
      pageIndex: request.pageIndex,
      pageSize: request.pageSize,
      totalItems,
      totalPages: getTotalPages(totalItems, request.pageSize),
    };
  }

  async findVisibleById(
    id: string,
    viewerUserId: string,
  ): Promise<Worldbook | null> {
    const row = await this.db
      .selectFrom("worldbooks")
      .selectAll()
      .where("id", "=", id)
      .where((builder) =>
        builder.or([
          builder("owner_user_id", "=", viewerUserId),
          builder("visibility", "=", "public"),
        ]),
      )
      .executeTakeFirst();

    return row ? this.aggregate(row) : null;
  }

  async findOwnedById(
    id: string,
    ownerUserId: string,
  ): Promise<Worldbook | null> {
    const row = await this.db
      .selectFrom("worldbooks")
      .selectAll()
      .where("id", "=", id)
      .where("owner_user_id", "=", ownerUserId)
      .executeTakeFirst();

    return row ? this.aggregate(row) : null;
  }

  async save(worldbook: Worldbook): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto("worldbooks")
        .values(toWorldbookRow(worldbook))
        .execute();

      if (worldbook.entries.length > 0) {
        await trx
          .insertInto("worldbook_entries")
          .values(worldbook.entries.map(toEntryRow))
          .execute();
      }
    });
  }

  async update(worldbook: Worldbook): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable("worldbooks")
        .set(toWorldbookRow(worldbook))
        .where("id", "=", worldbook.id)
        .where("owner_user_id", "=", worldbook.ownerUserId)
        .execute();
      await trx
        .deleteFrom("worldbook_entries")
        .where("worldbook_id", "=", worldbook.id)
        .execute();

      if (worldbook.entries.length > 0) {
        await trx
          .insertInto("worldbook_entries")
          .values(worldbook.entries.map(toEntryRow))
          .execute();
      }
    });
  }

  async deleteOwned(id: string, ownerUserId: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom("worldbooks")
      .where("id", "=", id)
      .where("owner_user_id", "=", ownerUserId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  private async aggregate(row: WorldbookRow): Promise<Worldbook> {
    const entries = await this.db
      .selectFrom("worldbook_entries")
      .selectAll()
      .where("worldbook_id", "=", row.id)
      .orderBy("display_order", "asc")
      .orderBy("created_at_ms", "asc")
      .execute();

    return {
      id: row.id,
      ownerUserId: row.owner_user_id,
      visibility: row.visibility,
      name: row.name,
      description: row.description,
      tags: jsonColumn<string[]>(row.tags_json),
      scanDepth: row.scan_depth,
      tokenBudget: row.token_budget,
      recursiveScan: row.recursive_scan === 1,
      entries: entries.map(toWorldbookEntry),
      sourceFormat: row.source_format,
      sourceSnapshot: jsonColumn<unknown>(row.source_snapshot_json),
      createdAtMs: epochMillisColumn(row.created_at_ms),
      updatedAtMs: epochMillisColumn(row.updated_at_ms),
      lastUsedAtMs: nullableEpochMillisColumn(row.last_used_at_ms),
      usageCount: row.usage_count,
    };
  }

  private async summaryStats(
    worldbookIds: string[],
  ): Promise<Map<string, WorldbookSummaryStats>> {
    const stats = new Map<string, WorldbookSummaryStats>(
      worldbookIds.map((id) => [
        id,
        { entryCount: 0, enabledEntryCount: 0, tokenCount: 0 },
      ]),
    );

    if (worldbookIds.length === 0) {
      return stats;
    }

    const rows = await this.db
      .selectFrom("worldbook_entries")
      .select(["worldbook_id", "enabled", "token_count"])
      .where("worldbook_id", "in", worldbookIds)
      .execute();

    for (const row of rows) {
      const worldbookStats = stats.get(row.worldbook_id);

      if (worldbookStats) {
        worldbookStats.entryCount += 1;
        worldbookStats.tokenCount += row.token_count;

        if (row.enabled === 1) {
          worldbookStats.enabledEntryCount += 1;
        }
      }
    }

    return stats;
  }
}

type WorldbookRow = Selectable<WorldbooksTable>;
type WorldbookListRow = Pick<
  WorldbookRow,
  | "id"
  | "owner_user_id"
  | "visibility"
  | "name"
  | "description"
  | "tags_json"
  | "scan_depth"
  | "token_budget"
  | "recursive_scan"
  | "created_at_ms"
  | "updated_at_ms"
  | "last_used_at_ms"
  | "usage_count"
>;
type WorldbookInsert = Insertable<WorldbooksTable>;
type WorldbookEntryRow = Selectable<WorldbookEntriesTable>;
type WorldbookEntryInsert = Insertable<WorldbookEntriesTable>;
type WorldbookSelectQuery = SelectQueryBuilder<
  Database,
  "worldbooks",
  Record<string, never>
>;
type WorldbookSummaryStats = Pick<
  WorldbookSummary,
  "entryCount" | "enabledEntryCount" | "tokenCount"
>;

const sortColumns = {
  createdAt: "created_at_ms",
  updatedAt: "updated_at_ms",
  name: "name",
  lastUsedAt: "last_used_at_ms",
  usageCount: "usage_count",
} satisfies Record<WorldbookSortKey, keyof WorldbooksTable>;

function withListFilters(
  query: WorldbookSelectQuery,
  request: ListWorldbooksRequest,
): WorldbookSelectQuery {
  let nextQuery = query.where((builder) =>
    builder.or([
      builder("owner_user_id", "=", request.viewerUserId),
      builder("visibility", "=", "public"),
    ]),
  );

  if (request.q.trim().length > 0) {
    nextQuery = nextQuery.where("name", "like", `%${request.q.trim()}%`);
  }

  return nextQuery;
}

function toWorldbookRow(worldbook: Worldbook): WorldbookInsert {
  return {
    id: worldbook.id,
    owner_user_id: worldbook.ownerUserId,
    visibility: worldbook.visibility,
    name: worldbook.name,
    description: worldbook.description,
    tags_json: JSON.stringify(worldbook.tags),
    scan_depth: worldbook.scanDepth,
    token_budget: worldbook.tokenBudget,
    recursive_scan: worldbook.recursiveScan ? 1 : 0,
    source_format: worldbook.sourceFormat,
    source_snapshot_json: JSON.stringify(worldbook.sourceSnapshot),
    created_at_ms: ensureEpochMillis(worldbook.createdAtMs),
    updated_at_ms: ensureEpochMillis(worldbook.updatedAtMs),
    last_used_at_ms:
      worldbook.lastUsedAtMs === null
        ? null
        : ensureEpochMillis(worldbook.lastUsedAtMs),
    usage_count: worldbook.usageCount,
  };
}

function toEntryRow(entry: WorldbookEntry): WorldbookEntryInsert {
  return {
    id: entry.id,
    worldbook_id: entry.worldbookId,
    external_uid: entry.externalUid,
    enabled: entry.enabled ? 1 : 0,
    name: entry.name,
    add_memo: entry.addMemo ? 1 : 0,
    comment: entry.comment,
    content: entry.content,
    primary_keys_json: JSON.stringify(entry.primaryKeys),
    secondary_keys_json: JSON.stringify(entry.secondaryKeys),
    condition_logic: entry.conditionLogic,
    selective: entry.selective ? 1 : 0,
    constant: entry.constant ? 1 : 0,
    vectorized: entry.vectorized ? 1 : 0,
    case_sensitive: entry.caseSensitive,
    match_whole_words: entry.matchWholeWords,
    insertion_position: entry.insertionPosition,
    depth_role: entry.depthRole,
    insertion_order: entry.insertionOrder,
    display_order: entry.displayOrder,
    depth: entry.insertionDepth,
    use_probability: entry.useProbability ? 1 : 0,
    probability: entry.probability,
    scan_depth: entry.scanDepth,
    recursive_scan: entry.recursiveScan ? 1 : 0,
    prevent_further_recursion: entry.preventFurtherRecursion ? 1 : 0,
    delay_until_recursion: entry.delayUntilRecursion ? 1 : 0,
    recursion_delay_level: entry.recursionDelayLevel,
    ignore_budget: entry.ignoreBudget ? 1 : 0,
    entry_group: entry.group,
    group_override: entry.groupOverride ? 1 : 0,
    group_weight: entry.groupWeight,
    use_group_scoring: entry.useGroupScoring,
    sticky: entry.sticky,
    cooldown: entry.cooldown,
    delay: entry.delay,
    match_persona_description: entry.matchPersonaDescription ? 1 : 0,
    match_character_description: entry.matchCharacterDescription ? 1 : 0,
    match_character_personality: entry.matchCharacterPersonality ? 1 : 0,
    match_scenario: entry.matchScenario ? 1 : 0,
    match_creator_notes: entry.matchCreatorNotes ? 1 : 0,
    match_character_depth_prompt: entry.matchCharacterDepthPrompt ? 1 : 0,
    automation_id: entry.automationId,
    generation_triggers_json: JSON.stringify(entry.generationTriggers),
    outlet_name: entry.outletName,
    character_filter_json: JSON.stringify(entry.characterFilter),
    token_count: entry.tokenCount,
    created_at_ms: ensureEpochMillis(entry.createdAtMs),
    updated_at_ms: ensureEpochMillis(entry.updatedAtMs),
  };
}

function toWorldbookSummary(
  row: WorldbookListRow,
  stats: WorldbookSummaryStats | undefined,
): WorldbookSummary {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    visibility: row.visibility,
    name: row.name,
    description: row.description,
    tags: jsonColumn<string[]>(row.tags_json),
    scanDepth: row.scan_depth,
    tokenBudget: row.token_budget,
    recursiveScan: row.recursive_scan === 1,
    entryCount: stats?.entryCount ?? 0,
    enabledEntryCount: stats?.enabledEntryCount ?? 0,
    tokenCount: stats?.tokenCount ?? 0,
    createdAtMs: epochMillisColumn(row.created_at_ms),
    updatedAtMs: epochMillisColumn(row.updated_at_ms),
    lastUsedAtMs: nullableEpochMillisColumn(row.last_used_at_ms),
    usageCount: row.usage_count,
  };
}

function toWorldbookEntry(row: WorldbookEntryRow): WorldbookEntry {
  return {
    id: row.id,
    worldbookId: row.worldbook_id,
    externalUid: row.external_uid,
    enabled: row.enabled === 1,
    name: row.name,
    addMemo: row.add_memo === 1,
    comment: row.comment,
    content: row.content,
    primaryKeys: jsonColumn<string[]>(row.primary_keys_json),
    secondaryKeys: jsonColumn<string[]>(row.secondary_keys_json),
    conditionLogic: row.condition_logic,
    selective: row.selective === 1,
    constant: row.constant === 1,
    vectorized: row.vectorized === 1,
    caseSensitive: row.case_sensitive,
    matchWholeWords: row.match_whole_words,
    insertionPosition: row.insertion_position,
    depthRole: row.depth_role,
    insertionOrder: row.insertion_order,
    displayOrder: row.display_order,
    insertionDepth: row.depth,
    useProbability: row.use_probability === 1,
    probability: row.probability,
    scanDepth: row.scan_depth,
    recursiveScan: row.recursive_scan === 1,
    preventFurtherRecursion: row.prevent_further_recursion === 1,
    delayUntilRecursion: row.delay_until_recursion === 1,
    recursionDelayLevel: row.recursion_delay_level,
    ignoreBudget: row.ignore_budget === 1,
    group: row.entry_group,
    groupOverride: row.group_override === 1,
    groupWeight: row.group_weight,
    useGroupScoring: row.use_group_scoring,
    sticky: row.sticky,
    cooldown: row.cooldown,
    delay: row.delay,
    matchPersonaDescription: row.match_persona_description === 1,
    matchCharacterDescription: row.match_character_description === 1,
    matchCharacterPersonality: row.match_character_personality === 1,
    matchScenario: row.match_scenario === 1,
    matchCreatorNotes: row.match_creator_notes === 1,
    matchCharacterDepthPrompt: row.match_character_depth_prompt === 1,
    automationId: row.automation_id,
    generationTriggers: jsonColumn<WorldbookGenerationTrigger[]>(
      row.generation_triggers_json,
    ),
    outletName: row.outlet_name,
    characterFilter: jsonColumn<WorldbookCharacterFilter>(
      row.character_filter_json,
    ),
    tokenCount: row.token_count,
    createdAtMs: epochMillisColumn(row.created_at_ms),
    updatedAtMs: epochMillisColumn(row.updated_at_ms),
  };
}

function jsonColumn<TValue>(value: string): TValue {
  return JSON.parse(value) as TValue;
}

function epochMillisColumn(value: unknown): number {
  return ensureEpochMillis(numberColumn(value));
}

function nullableEpochMillisColumn(value: unknown): number | null {
  return value === null ? null : ensureEpochMillis(numberColumn(value));
}

function numberColumn(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    return Number(value);
  }

  throw new Error(
    "Database number column must be a number, bigint, or string.",
  );
}
