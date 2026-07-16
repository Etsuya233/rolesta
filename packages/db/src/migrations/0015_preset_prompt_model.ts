import { randomUUID } from 'node:crypto';
import { encode } from 'gpt-tokenizer/encoding/cl100k_base';
import { sql, type Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

const defaultOrder = [
  'mainPrompt',
  'worldInfoBefore',
  'personaDescription',
  'characterDescription',
  'characterPersonality',
  'scenario',
  'enhanceDefinitions',
  'auxiliaryPrompt',
  'worldInfoAfter',
  'dialogueExamples',
  'chatHistory',
  'postHistoryInstructions',
] as const;

const systemDefaults = {
  mainPrompt: {
    name: 'Main Prompt',
    role: 'system',
    content:
      "Write {{char}}'s next reply in a fictional chat between {{charIfNotGroup}} and {{user}}.",
    allowCharacterOverride: 1,
    enabled: 1,
  },
  auxiliaryPrompt: {
    name: 'Auxiliary Prompt',
    role: 'system',
    content: '',
    allowCharacterOverride: null,
    enabled: 1,
  },
  enhanceDefinitions: {
    name: 'Enhance Definitions',
    role: 'system',
    content:
      "If you have more knowledge of {{char}}, add to the character's lore and personality to enhance them but keep the Character Sheet's definitions absolute.",
    allowCharacterOverride: null,
    enabled: 0,
  },
  postHistoryInstructions: {
    name: 'Post-History Instructions',
    role: 'system',
    content: '',
    allowCharacterOverride: 1,
    enabled: 1,
  },
} as const;

const reservedIdentifierToKey = {
  main: 'mainPrompt',
  nsfw: 'auxiliaryPrompt',
  jailbreak: 'postHistoryInstructions',
  enhanceDefinitions: 'enhanceDefinitions',
  worldInfoBefore: 'worldInfoBefore',
  personaDescription: 'personaDescription',
  charDescription: 'characterDescription',
  charPersonality: 'characterPersonality',
  scenario: 'scenario',
  worldInfoAfter: 'worldInfoAfter',
  dialogueExamples: 'dialogueExamples',
  chatHistory: 'chatHistory',
} as const;

type SystemKey = keyof typeof systemDefaults;
type SlotKey =
  | 'worldInfoBefore'
  | 'personaDescription'
  | 'characterDescription'
  | 'characterPersonality'
  | 'scenario'
  | 'worldInfoAfter'
  | 'dialogueExamples'
  | 'chatHistory';
type ItemKey = SystemKey | SlotKey;

type OldPresetRow = {
  id: string;
  source_format: 'sillytavern_preset' | 'rolesta';
};

type OldEntryRow = {
  id: string;
  preset_id: string;
  identifier: string;
  name: string;
  role: 'system' | 'user' | 'assistant';
  position: 'system' | 'chat' | 'preHistory' | 'postHistory' | 'unknown';
  content: string;
  token_count: number;
  metadata_json: string;
  created_at_ms: number;
  updated_at_ms: number;
};

type OldPromptItemRow = {
  preset_id: string;
  entry_id: string;
  enabled: number;
  order_index: number;
};

type OldEntryV1Row = {
  id: string;
  preset_id: string;
  identifier: string;
  name: string;
  role: 'system' | 'user' | 'assistant';
  position: 'system' | 'chat' | 'preHistory' | 'postHistory' | 'unknown';
  content: string;
  token_count: number;
  metadata_json: string;
  created_at_ms: number;
  updated_at_ms: number;
};

type NewEntryRow = {
  id: string;
  preset_id: string;
  identifier: string;
  name: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  placement_kind: 'relative' | 'inChat';
  in_chat_depth: number | null;
  in_chat_order: number | null;
  generation_types_json: string;
  token_count: number;
  metadata_json: string;
  created_at_ms: number;
  updated_at_ms: number;
};

type NewPromptItemRow = {
  id: string;
  preset_id: string;
  kind: 'slot' | 'systemPrompt' | 'customPrompt';
  slot_key: SlotKey | null;
  system_prompt_key: SystemKey | null;
  entry_id: string | null;
  name: string | null;
  role: 'system' | 'user' | 'assistant' | null;
  content: string | null;
  placement_kind: 'relative' | 'inChat' | null;
  in_chat_depth: number | null;
  in_chat_order: number | null;
  generation_types_json: string;
  allow_character_override: number | null;
  token_count: number | null;
  enabled: number;
  order_index: number;
};

type OldDatabase = Database & {
  preset_entries_v1: {
    id: string;
    preset_id: string;
    identifier: string;
    name: string;
    role: 'system' | 'user' | 'assistant';
    position: 'system' | 'chat' | 'preHistory' | 'postHistory' | 'unknown';
    content: string;
    token_count: number;
    metadata_json: string;
    created_at_ms: number;
    updated_at_ms: number;
  };
  preset_prompt_items_v1: OldPromptItemRow;
  preset_entries_v2: NewEntryRow;
  preset_prompt_items_v2: NewPromptItemRow;
};

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('preset_entries_v2')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('preset_id', 'varchar(255)', (column) =>
      column.notNull().references('presets.id').onDelete('cascade'),
    )
    .addColumn('identifier', 'varchar(255)', (column) => column.notNull())
    .addColumn('name', 'varchar(255)', (column) => column.notNull())
    .addColumn('role', 'varchar(32)', (column) => column.notNull())
    .addColumn('content', 'text', (column) => column.notNull())
    .addColumn('placement_kind', 'varchar(32)', (column) => column.notNull())
    .addColumn('in_chat_depth', 'integer')
    .addColumn('in_chat_order', 'integer')
    .addColumn('generation_types_json', 'text', (column) => column.notNull())
    .addColumn('token_count', 'integer', (column) => column.notNull())
    .addColumn('metadata_json', 'text', (column) => column.notNull())
    .addColumn('created_at_ms', 'integer', (column) => column.notNull())
    .addColumn('updated_at_ms', 'integer', (column) => column.notNull())
    .execute();

  await db.schema
    .createTable('preset_prompt_items_v2')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('preset_id', 'varchar(255)', (column) =>
      column.notNull().references('presets.id').onDelete('cascade'),
    )
    .addColumn('kind', 'varchar(32)', (column) => column.notNull())
    .addColumn('slot_key', 'varchar(64)')
    .addColumn('system_prompt_key', 'varchar(64)')
    .addColumn('entry_id', 'varchar(255)', (column) =>
      column.references('preset_entries_v2.id').onDelete('cascade'),
    )
    .addColumn('name', 'varchar(255)')
    .addColumn('role', 'varchar(32)')
    .addColumn('content', 'text')
    .addColumn('placement_kind', 'varchar(32)')
    .addColumn('in_chat_depth', 'integer')
    .addColumn('in_chat_order', 'integer')
    .addColumn('generation_types_json', 'text', (column) => column.notNull())
    .addColumn('allow_character_override', 'integer')
    .addColumn('token_count', 'integer')
    .addColumn('enabled', 'integer', (column) => column.notNull())
    .addColumn('order_index', 'integer', (column) => column.notNull())
    .execute();

  const oldDatabase = db as unknown as Kysely<OldDatabase>;
  const presets = await sql<OldPresetRow>`select id, source_format from presets`.execute(db);
  const entries = await sql<OldEntryRow>`select * from preset_entries`.execute(db);
  const promptItems = await sql<OldPromptItemRow>`select * from preset_prompt_items`.execute(db);
  const entriesByPreset = groupBy(entries.rows, (entry) => entry.preset_id);
  const itemsByPreset = groupBy(promptItems.rows, (item) => item.preset_id);

  for (const preset of presets.rows) {
    const converted = convertPreset(
      preset,
      entriesByPreset.get(preset.id) ?? [],
      itemsByPreset.get(preset.id) ?? [],
    );
    if (converted.entries.length > 0) {
      await oldDatabase.insertInto('preset_entries_v2').values(converted.entries).execute();
    }
    if (converted.promptItems.length > 0) {
      await oldDatabase
        .insertInto('preset_prompt_items_v2')
        .values(converted.promptItems)
        .execute();
    }
  }

  await db.schema.dropTable('preset_prompt_items').execute();
  await db.schema.dropTable('preset_entries').execute();
  await db.schema.alterTable('preset_entries_v2').renameTo('preset_entries').execute();
  await db.schema.alterTable('preset_prompt_items_v2').renameTo('preset_prompt_items').execute();

  await createIndexes(db);
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('preset_entries_v1')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('preset_id', 'varchar(255)', (column) =>
      column.notNull().references('presets.id').onDelete('cascade'),
    )
    .addColumn('identifier', 'varchar(255)', (column) => column.notNull())
    .addColumn('name', 'varchar(255)', (column) => column.notNull())
    .addColumn('role', 'varchar(32)', (column) => column.notNull())
    .addColumn('position', 'varchar(32)', (column) => column.notNull())
    .addColumn('content', 'text', (column) => column.notNull())
    .addColumn('token_count', 'integer', (column) => column.notNull())
    .addColumn('metadata_json', 'text', (column) => column.notNull())
    .addColumn('created_at_ms', 'integer', (column) => column.notNull())
    .addColumn('updated_at_ms', 'integer', (column) => column.notNull())
    .execute();
  await db.schema
    .createTable('preset_prompt_items_v1')
    .addColumn('preset_id', 'varchar(255)', (column) =>
      column.notNull().references('presets.id').onDelete('cascade'),
    )
    .addColumn('entry_id', 'varchar(255)', (column) =>
      column.notNull().references('preset_entries_v1.id').onDelete('cascade'),
    )
    .addColumn('enabled', 'integer', (column) => column.notNull())
    .addColumn('order_index', 'integer', (column) => column.notNull())
    .addPrimaryKeyConstraint('preset_prompt_items_v1_pk', ['preset_id', 'entry_id'])
    .execute();

  const oldDatabase = db as unknown as Kysely<OldDatabase>;
  const presets = await sql<OldPresetRow>`select id, source_format from presets`.execute(db);
  const entries = await sql<NewEntryRow>`select * from preset_entries`.execute(db);
  const promptItems = await sql<NewPromptItemRow>`select * from preset_prompt_items`.execute(db);
  const entriesByPreset = groupBy(entries.rows, (entry) => entry.preset_id);
  const itemsByPreset = groupBy(promptItems.rows, (item) => item.preset_id);

  for (const preset of presets.rows) {
    const converted = convertDown(
      preset,
      entriesByPreset.get(preset.id) ?? [],
      itemsByPreset.get(preset.id) ?? [],
    );
    if (converted.entries.length > 0) {
      await oldDatabase.insertInto('preset_entries_v1').values(converted.entries).execute();
    }
    if (converted.promptItems.length > 0) {
      await oldDatabase
        .insertInto('preset_prompt_items_v1')
        .values(converted.promptItems)
        .execute();
    }
  }

  await dropIndexes(db);
  await db.schema.dropTable('preset_prompt_items').execute();
  await db.schema.dropTable('preset_entries').execute();
  await db.schema.alterTable('preset_entries_v1').renameTo('preset_entries').execute();
  await db.schema.alterTable('preset_prompt_items_v1').renameTo('preset_prompt_items').execute();
  await db.schema
    .createIndex('preset_entries_preset_idx')
    .on('preset_entries')
    .column('preset_id')
    .execute();
  await db.schema
    .createIndex('preset_entries_identifier_idx')
    .on('preset_entries')
    .columns(['preset_id', 'identifier'])
    .execute();
  await db.schema
    .createIndex('preset_prompt_items_order_idx')
    .on('preset_prompt_items')
    .columns(['preset_id', 'order_index'])
    .execute();
}

function convertPreset(
  preset: OldPresetRow,
  oldEntries: OldEntryRow[],
  oldItems: OldPromptItemRow[],
): { entries: NewEntryRow[]; promptItems: NewPromptItemRow[] } {
  const entryById = new Map(oldEntries.map((entry) => [entry.id, entry]));
  const sortedItems = [...oldItems].sort((left, right) => left.order_index - right.order_index);
  const itemByKey = new Map<ItemKey, NewPromptItemRow>();
  const convertedEntries: NewEntryRow[] = [];
  const convertedItems: NewPromptItemRow[] = [];
  const reservedEntryIds = new Set<string>();

  for (const [identifier, key] of Object.entries(reservedIdentifierToKey) as Array<
    [string, ItemKey]
  >) {
    const candidates = oldEntries.filter((entry) => entry.identifier === identifier);
    const selected = sortedItems
      .map((item) => entryById.get(item.entry_id))
      .find(
        (entry) => entry !== undefined && candidates.some((candidate) => candidate.id === entry.id),
      );
    const primary = selected ?? candidates[0];

    if (primary) {
      reservedEntryIds.add(primary.id);
      const oldItem = sortedItems.find((item) => item.entry_id === primary.id);
      itemByKey.set(key, convertReservedItem(preset, key, primary, oldItem));
    }
  }

  const usedIdentifiers = new Set(
    oldEntries
      .filter(
        (entry) =>
          reservedIdentifierToKey[entry.identifier as keyof typeof reservedIdentifierToKey] ===
          undefined,
      )
      .map((entry) => entry.identifier),
  );

  for (const entry of oldEntries) {
    const reservedKey =
      reservedIdentifierToKey[entry.identifier as keyof typeof reservedIdentifierToKey];
    if (reservedKey && reservedEntryIds.has(entry.id)) {
      continue;
    }

    const identifier = reservedKey
      ? uniqueCustomIdentifier(entry.identifier, usedIdentifiers)
      : entry.identifier;
    convertedEntries.push(convertEntry(preset, entry, identifier));
    usedIdentifiers.add(identifier);
  }

  for (const item of sortedItems) {
    const entry = entryById.get(item.entry_id);
    if (!entry) {
      continue;
    }
    const reservedKey =
      reservedIdentifierToKey[entry.identifier as keyof typeof reservedIdentifierToKey];
    if (reservedKey && reservedEntryIds.has(entry.id)) {
      continue;
    }
    const convertedEntry = convertedEntries.find((candidate) => candidate.id === entry.id);
    const entryId = convertedEntry?.id ?? entry.id;
    convertedItems.push({
      id: entry.id,
      preset_id: preset.id,
      kind: 'customPrompt',
      slot_key: null,
      system_prompt_key: null,
      entry_id: entryId,
      name: null,
      role: null,
      content: null,
      placement_kind: null,
      in_chat_depth: null,
      in_chat_order: null,
      generation_types_json: '[]',
      allow_character_override: null,
      token_count: null,
      enabled: item.enabled,
      order_index: item.order_index,
    });
  }

  const finalItems = [...itemByKey.values(), ...convertedItems].sort((left, right) => {
    const leftOrder = left.order_index;
    const rightOrder = right.order_index;
    return leftOrder - rightOrder;
  });
  const presentKeys = new Set<ItemKey>(itemByKey.keys());
  let nextOrder =
    finalItems.length === 0 ? 0 : Math.max(...finalItems.map((item) => item.order_index)) + 1;

  for (const key of defaultOrder) {
    if (presentKeys.has(key)) {
      continue;
    }
    const item = defaultItem(preset.id, key, nextOrder++);
    finalItems.push(item);
  }

  return {
    entries: convertedEntries,
    promptItems: finalItems.map((item, orderIndex) => ({ ...item, order_index: orderIndex })),
  };
}

function convertReservedItem(
  preset: OldPresetRow,
  key: ItemKey,
  entry: OldEntryRow,
  oldItem: OldPromptItemRow | undefined,
): NewPromptItemRow {
  if (isSystemKey(key)) {
    const metadata = parseJson(entry.metadata_json) as Record<string, unknown>;
    return {
      id: oldItem?.entry_id ?? randomUUID(),
      preset_id: preset.id,
      kind: 'systemPrompt',
      slot_key: null,
      system_prompt_key: key,
      entry_id: null,
      name: entry.name,
      role: entry.role,
      content: entry.content,
      placement_kind: 'relative',
      in_chat_depth: null,
      in_chat_order: null,
      generation_types_json: JSON.stringify(generationTypes(metadata)),
      allow_character_override:
        key === 'mainPrompt' || key === 'postHistoryInstructions'
          ? metadata.forbid_overrides === true
            ? 0
            : 1
          : null,
      token_count: entry.token_count,
      enabled: oldItem?.enabled ?? 0,
      order_index: oldItem?.order_index ?? Number.MAX_SAFE_INTEGER,
    };
  }

  const placement = placementFromOld(preset.source_format, entry);
  if (isStructuralSlot(key)) {
    return {
      id: oldItem?.entry_id ?? randomUUID(),
      preset_id: preset.id,
      kind: 'slot',
      slot_key: key,
      system_prompt_key: null,
      entry_id: null,
      name: null,
      role: null,
      content: null,
      placement_kind: 'relative',
      in_chat_depth: null,
      in_chat_order: null,
      generation_types_json: '[]',
      allow_character_override: null,
      token_count: null,
      enabled: oldItem?.enabled ?? 0,
      order_index: oldItem?.order_index ?? Number.MAX_SAFE_INTEGER,
    };
  }

  return {
    id: oldItem?.entry_id ?? randomUUID(),
    preset_id: preset.id,
    kind: 'slot',
    slot_key: key,
    system_prompt_key: null,
    entry_id: null,
    name: null,
    role: entry.role,
    content: null,
    placement_kind: placement.kind,
    in_chat_depth: placement.kind === 'inChat' ? placement.depth : null,
    in_chat_order: placement.kind === 'inChat' ? placement.order : null,
    generation_types_json: JSON.stringify(generationTypes(parseJson(entry.metadata_json))),
    allow_character_override: null,
    token_count: null,
    enabled: oldItem?.enabled ?? 0,
    order_index: oldItem?.order_index ?? Number.MAX_SAFE_INTEGER,
  };
}

function convertEntry(preset: OldPresetRow, entry: OldEntryRow, identifier: string): NewEntryRow {
  const placement = placementFromOld(preset.source_format, entry);
  const metadata = parseJson(entry.metadata_json);
  return {
    id: entry.id,
    preset_id: entry.preset_id,
    identifier,
    name: entry.name,
    role: entry.role,
    content: entry.content,
    placement_kind: placement.kind,
    in_chat_depth: placement.kind === 'inChat' ? placement.depth : null,
    in_chat_order: placement.kind === 'inChat' ? placement.order : null,
    generation_types_json: JSON.stringify(generationTypes(metadata)),
    token_count: entry.token_count,
    metadata_json: entry.metadata_json,
    created_at_ms: entry.created_at_ms,
    updated_at_ms: entry.updated_at_ms,
  };
}

function defaultItem(presetId: string, key: ItemKey, orderIndex: number): NewPromptItemRow {
  if (isSystemKey(key)) {
    const defaults = systemDefaults[key];
    return {
      id: randomUUID(),
      preset_id: presetId,
      kind: 'systemPrompt',
      slot_key: null,
      system_prompt_key: key,
      entry_id: null,
      name: defaults.name,
      role: defaults.role,
      content: defaults.content,
      placement_kind: 'relative',
      in_chat_depth: null,
      in_chat_order: null,
      generation_types_json: '[]',
      allow_character_override: defaults.allowCharacterOverride,
      token_count: encode(defaults.content).length,
      enabled: 0,
      order_index: orderIndex,
    };
  }
  return {
    id: randomUUID(),
    preset_id: presetId,
    kind: 'slot',
    slot_key: key,
    system_prompt_key: null,
    entry_id: null,
    name: null,
    role: isStructuralSlot(key) ? null : 'system',
    content: null,
    placement_kind: 'relative',
    in_chat_depth: null,
    in_chat_order: null,
    generation_types_json: '[]',
    allow_character_override: null,
    token_count: null,
    enabled: 0,
    order_index: orderIndex,
  };
}

function convertDown(
  preset: OldPresetRow,
  entries: NewEntryRow[],
  items: NewPromptItemRow[],
): { entries: OldEntryV1Row[]; promptItems: OldPromptItemRow[] } {
  const outputEntries = entries.map((entry) => ({
    id: entry.id,
    preset_id: entry.preset_id,
    identifier: entry.identifier,
    name: entry.name,
    role: entry.role,
    position: entry.placement_kind === 'inChat' ? ('chat' as const) : ('system' as const),
    content: entry.content,
    token_count: entry.token_count,
    metadata_json: entry.metadata_json,
    created_at_ms: entry.created_at_ms,
    updated_at_ms: entry.updated_at_ms,
  }));
  const itemRows = [...items].sort((left, right) => left.order_index - right.order_index);
  const promptItems: OldPromptItemRow[] = [];

  for (const item of itemRows) {
    const entryId = item.kind === 'customPrompt' ? item.entry_id : item.id;
    if (entryId === null) {
      continue;
    }
    if (item.kind !== 'customPrompt') {
      const key = item.system_prompt_key ?? item.slot_key!;
      const identifier = reverseIdentifier(key);
      const placement = item.placement_kind === 'inChat' ? 'chat' : 'system';
      outputEntries.push({
        id: entryId,
        preset_id: preset.id,
        identifier,
        name: item.name ?? key,
        role: item.role ?? 'system',
        position: placement,
        content: item.content ?? '',
        token_count: item.token_count ?? 0,
        metadata_json: JSON.stringify({
          system_prompt: item.kind === 'systemPrompt',
          marker: item.kind === 'slot',
          injection_depth: item.in_chat_depth,
          injection_order: item.in_chat_order,
          injection_trigger: parseJson(item.generation_types_json),
          ...(item.allow_character_override === null
            ? {}
            : { forbid_overrides: item.allow_character_override === 0 }),
        }),
        created_at_ms: 0,
        updated_at_ms: 0,
      });
    }
    promptItems.push({
      preset_id: preset.id,
      entry_id: entryId,
      enabled: item.enabled,
      order_index: promptItems.length,
    });
  }

  return { entries: outputEntries, promptItems };
}

function placementFromOld(
  sourceFormat: OldPresetRow['source_format'],
  entry: OldEntryRow,
): { kind: 'relative' } | { kind: 'inChat'; depth: number; order: number } {
  if (entry.position === 'chat') {
    return inChatPlacement(entry.metadata_json);
  }
  if (sourceFormat === 'sillytavern_preset' && entry.position === 'preHistory') {
    return inChatPlacement(entry.metadata_json);
  }
  return { kind: 'relative' };
}

function inChatPlacement(metadataJson: string): { kind: 'inChat'; depth: number; order: number } {
  const metadata = parseJson(metadataJson) as Record<string, unknown>;
  return {
    kind: 'inChat',
    depth: integerMetadata(metadata.injection_depth, 4),
    order: integerMetadata(metadata.injection_order, 100),
  };
}

function integerMetadata(value: unknown, defaultValue: number): number {
  return typeof value === 'number' && Number.isInteger(value) ? value : defaultValue;
}

function generationTypes(metadata: unknown): string[] {
  if (!isRecord(metadata) || !Array.isArray(metadata.injection_trigger)) {
    return [];
  }
  return metadata.injection_trigger.filter(
    (value): value is string =>
      value === 'normal' ||
      value === 'continue' ||
      value === 'impersonate' ||
      value === 'swipe' ||
      value === 'regenerate' ||
      value === 'quiet',
  );
}

function uniqueCustomIdentifier(identifier: string, usedIdentifiers: Set<string>): string {
  let index = 1;
  let candidate = `${identifier}-custom-${index}`;
  while (usedIdentifiers.has(candidate)) {
    index += 1;
    candidate = `${identifier}-custom-${index}`;
  }
  return candidate;
}

function reverseIdentifier(key: ItemKey): string {
  const entries: Record<ItemKey, string> = {
    mainPrompt: 'main',
    auxiliaryPrompt: 'nsfw',
    postHistoryInstructions: 'jailbreak',
    enhanceDefinitions: 'enhanceDefinitions',
    worldInfoBefore: 'worldInfoBefore',
    personaDescription: 'personaDescription',
    characterDescription: 'charDescription',
    characterPersonality: 'charPersonality',
    scenario: 'scenario',
    worldInfoAfter: 'worldInfoAfter',
    dialogueExamples: 'dialogueExamples',
    chatHistory: 'chatHistory',
  };
  return entries[key];
}

function isSystemKey(key: ItemKey): key is SystemKey {
  return key in systemDefaults;
}

function isStructuralSlot(key: ItemKey): key is 'dialogueExamples' | 'chatHistory' {
  return key === 'dialogueExamples' || key === 'chatHistory';
}

function parseJson(value: string): unknown {
  return JSON.parse(value) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const item of items) {
    const groupKey = key(item);
    const group = result.get(groupKey);
    if (group) {
      group.push(item);
    } else {
      result.set(groupKey, [item]);
    }
  }
  return result;
}

async function createIndexes(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createIndex('preset_entries_preset_idx')
    .on('preset_entries')
    .column('preset_id')
    .execute();
  await db.schema
    .createIndex('preset_entries_identifier_idx')
    .on('preset_entries')
    .columns(['preset_id', 'identifier'])
    .execute();
  await db.schema
    .createIndex('preset_prompt_items_order_idx')
    .on('preset_prompt_items')
    .columns(['preset_id', 'order_index'])
    .execute();
  await db.schema
    .createIndex('preset_prompt_items_kind_idx')
    .on('preset_prompt_items')
    .columns(['preset_id', 'kind'])
    .execute();
  await db.schema
    .createIndex('preset_prompt_items_entry_idx')
    .on('preset_prompt_items')
    .columns(['preset_id', 'entry_id'])
    .execute();
}

async function dropIndexes(db: Kysely<Database>): Promise<void> {
  await db.schema.dropIndex('preset_prompt_items_entry_idx').ifExists().execute();
  await db.schema.dropIndex('preset_prompt_items_kind_idx').ifExists().execute();
  await db.schema.dropIndex('preset_prompt_items_order_idx').ifExists().execute();
  await db.schema.dropIndex('preset_entries_identifier_idx').ifExists().execute();
  await db.schema.dropIndex('preset_entries_preset_idx').ifExists().execute();
}
