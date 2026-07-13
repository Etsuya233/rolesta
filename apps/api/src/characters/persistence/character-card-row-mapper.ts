import type { CharactersTable } from '@rolesta/db';
import type { Insertable, Selectable } from 'kysely';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type { CharacterCard } from '../domain/character-card.js';

type CharacterRow = Selectable<CharactersTable>;
type CharacterInsert = Insertable<CharactersTable>;

export function toCharacterCard(row: CharacterRow): CharacterCard {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    avatarResourceId: row.avatar_resource_id,
    visibility: row.visibility,
    name: row.name,
    nickname: row.nickname,
    comment: row.comment,
    tags: jsonColumn<string[]>(row.tags_json),
    version: row.version,
    creator: row.creator,
    description: row.description,
    personality: row.personality,
    scenario: row.scenario,
    firstMessage: row.first_message,
    alternateGreetings: jsonColumn<string[]>(row.alternate_greetings_json),
    groupOnlyGreetings: jsonColumn<string[]>(row.group_only_greetings_json),
    messageExample: row.message_example,
    creatorNotes: row.creator_notes,
    creatorNotesMultilingual: jsonColumn<Record<string, string>>(row.creator_notes_multilingual_json),
    systemPrompt: row.system_prompt,
    postHistoryInstructions: row.post_history_instructions,
    characterBook:
      row.character_book_json === null ? null : jsonColumn<Record<string, unknown>>(row.character_book_json),
    assets: jsonColumn<unknown[]>(row.assets_json),
    source: jsonColumn<string[]>(row.source_json),
    metadata: jsonColumn<Record<string, unknown>>(row.metadata_json),
    sourceFormat: row.source_format,
    sourceSnapshot: jsonColumn<unknown>(row.source_snapshot_json),
    createdAtMs: epochMillisColumn(row.created_at_ms),
    updatedAtMs: epochMillisColumn(row.updated_at_ms),
    creationDateMs: nullableEpochMillisColumn(row.creation_date_ms),
    modificationDateMs: nullableEpochMillisColumn(row.modification_date_ms),
    lastUsedAtMs: nullableEpochMillisColumn(row.last_used_at_ms),
    usageCount: row.usage_count,
  };
}

export function toCharacterRow(card: CharacterCard): CharacterInsert {
  return {
    id: card.id,
    owner_user_id: card.ownerUserId,
    avatar_resource_id: card.avatarResourceId,
    visibility: card.visibility,
    name: card.name,
    nickname: card.nickname,
    comment: card.comment,
    tags_json: JSON.stringify(card.tags),
    version: card.version,
    creator: card.creator,
    description: card.description,
    personality: card.personality,
    scenario: card.scenario,
    first_message: card.firstMessage,
    alternate_greetings_json: JSON.stringify(card.alternateGreetings),
    group_only_greetings_json: JSON.stringify(card.groupOnlyGreetings),
    message_example: card.messageExample,
    creator_notes: card.creatorNotes,
    creator_notes_multilingual_json: JSON.stringify(card.creatorNotesMultilingual),
    system_prompt: card.systemPrompt,
    post_history_instructions: card.postHistoryInstructions,
    character_book_json: card.characterBook === null ? null : JSON.stringify(card.characterBook),
    assets_json: JSON.stringify(card.assets),
    source_json: JSON.stringify(card.source),
    metadata_json: JSON.stringify(card.metadata),
    source_format: card.sourceFormat,
    source_snapshot_json: JSON.stringify(card.sourceSnapshot),
    created_at_ms: ensureEpochMillis(card.createdAtMs),
    updated_at_ms: ensureEpochMillis(card.updatedAtMs),
    creation_date_ms: card.creationDateMs === null ? null : ensureEpochMillis(card.creationDateMs),
    modification_date_ms: card.modificationDateMs === null ? null : ensureEpochMillis(card.modificationDateMs),
    last_used_at_ms: card.lastUsedAtMs === null ? null : ensureEpochMillis(card.lastUsedAtMs),
    usage_count: card.usageCount,
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
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'string') {
    return Number(value);
  }

  throw new Error('Database number column must be a number, bigint, or string.');
}
