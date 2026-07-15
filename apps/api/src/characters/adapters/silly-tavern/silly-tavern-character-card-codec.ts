import { Injectable } from '@nestjs/common';
import { CharacterPortError } from '../../ports/character-port-error.js';
import type { CharacterCard, CharacterCardSourceFormat } from '../../domain/character-card.js';
import type {
  CharacterCardCodec,
  CharacterCardExportVersion,
  ImportedCharacterCard,
  ImportCharacterCardFile,
} from '../../ports/character-card-codec.js';
import { readSillyTavernPngMetadata } from './silly-tavern-png-metadata-reader.js';

export interface SillyTavernCharacterCardOutput {
  spec: 'chara_card_v2' | 'chara_card_v3';
  spec_version: '2.0' | '3.0';
  data: Record<string, unknown>;
}

@Injectable()
export class SillyTavernCharacterCardCodec implements CharacterCardCodec {
  importFile(file: ImportCharacterCardFile): ImportedCharacterCard {
    return fromSillyTavernCharacterCard(
      importFileContent(file.fileName, file.content),
      file.fileName,
    );
  }

  exportCard(card: CharacterCard, options: { version: CharacterCardExportVersion }): object {
    return toSillyTavernCharacterCard(card, options.version);
  }
}

export function fromSillyTavernCharacterCard(
  input: unknown,
  fileName?: string,
): ImportedCharacterCard {
  const envelope = characterCardEnvelope(input, fileName);

  return {
    name: requiredStringField(envelope.data, 'name'),
    nickname: nullableStringField(envelope.data, 'nickname'),
    comment: stringField(envelope.data, 'creatorcomment'),
    tags: stringArrayField(envelope.data, 'tags'),
    version: stringField(envelope.data, 'character_version'),
    creator: nullableStringField(envelope.data, 'creator'),
    description: stringField(envelope.data, 'description'),
    personality: stringField(envelope.data, 'personality'),
    scenario: stringField(envelope.data, 'scenario'),
    firstMessage: stringField(envelope.data, 'first_mes'),
    alternateGreetings: stringArrayField(envelope.data, 'alternate_greetings'),
    groupOnlyGreetings: stringArrayField(envelope.data, 'group_only_greetings'),
    messageExample: stringField(envelope.data, 'mes_example'),
    creatorNotes: stringField(envelope.data, 'creator_notes'),
    creatorNotesMultilingual: stringRecordField(envelope.data, 'creator_notes_multilingual'),
    systemPrompt: stringField(envelope.data, 'system_prompt'),
    postHistoryInstructions: stringField(envelope.data, 'post_history_instructions'),
    characterBook: objectOrNullField(envelope.data, 'character_book'),
    assets: unknownArrayField(envelope.data, 'assets'),
    source: stringArrayField(envelope.data, 'source'),
    metadata: unknownRecordField(envelope.data, 'metadata'),
    sourceFormat: envelope.sourceFormat,
    sourceSnapshot: input,
    creationDateMs: epochMillisField(envelope.data, 'creation_date'),
    modificationDateMs: epochMillisField(envelope.data, 'modification_date'),
  };
}

export function toSillyTavernCharacterCard(
  card: CharacterCard,
  version: CharacterCardExportVersion,
): SillyTavernCharacterCardOutput {
  const data: Record<string, unknown> = {
    name: card.name,
    description: card.description,
    personality: card.personality,
    scenario: card.scenario,
    first_mes: card.firstMessage,
    mes_example: card.messageExample,
    creator_notes: card.creatorNotes,
    system_prompt: card.systemPrompt,
    post_history_instructions: card.postHistoryInstructions,
    alternate_greetings: card.alternateGreetings,
    tags: card.tags,
    creator: card.creator ?? '',
    character_version: card.version,
  };

  if (version === 'v3') {
    assignNonEmptyString(data, 'nickname', card.nickname);
    assignNonEmptyRecord(data, 'creator_notes_multilingual', card.creatorNotesMultilingual);
    assignNonEmptyArray(data, 'group_only_greetings', card.groupOnlyGreetings);
    assignNonEmptyArray(data, 'assets', card.assets);
    assignNonEmptyArray(data, 'source', card.source);
    assignDefinedValue(data, 'creation_date', card.creationDateMs);
    assignDefinedValue(data, 'modification_date', card.modificationDateMs);
  }

  assignDefinedValue(data, 'character_book', card.characterBook);

  return {
    spec: version === 'v3' ? 'chara_card_v3' : 'chara_card_v2',
    spec_version: version === 'v3' ? '3.0' : '2.0',
    data,
  };
}

interface CharacterCardEnvelope {
  sourceFormat: CharacterCardSourceFormat;
  data: Record<string, unknown>;
}

function characterCardEnvelope(input: unknown, fileName?: string): CharacterCardEnvelope {
  if (!isRecord(input)) {
    throw new CharacterPortError({
      reason: 'unsupported-character-card',
      params: {
        ...(fileName !== undefined ? { fileName } : {}),
        detail: 'Character card input is not a record.',
      },
    });
  }

  if (input.spec === 'chara_card_v3' && isRecord(input.data)) {
    return { sourceFormat: 'sillytavern_v3', data: input.data };
  }

  if ((input.spec === 'chara_card_v2' || 'data' in input) && isRecord(input.data)) {
    return { sourceFormat: 'sillytavern_v2', data: input.data };
  }

  if (!('data' in input) && hasV1CardField(input)) {
    return { sourceFormat: 'sillytavern_v1', data: input };
  }

  const params = {
    detail: 'Unsupported character card envelope.',
    ...(fileName !== undefined ? { fileName } : {}),
    ...(input.spec === 'chara_card_v2' || input.spec === 'chara_card_v3'
      ? { sourceFormat: String(input.spec) }
      : {}),
  };

  throw new CharacterPortError({
    reason: 'unsupported-character-card',
    params,
  });
}

function hasV1CardField(input: Record<string, unknown>): boolean {
  return 'name' in input || 'description' in input || 'first_mes' in input;
}

function requiredStringField(input: Record<string, unknown>, key: string): string {
  const value = input[key];

  if (typeof value === 'string') {
    return value;
  }

  throw new CharacterPortError({
    reason: 'invalid-character-card',
    params: {
      field: key,
      detail: 'Expected a string field.',
    },
  });
}

function stringField(input: Record<string, unknown>, key: string): string {
  const value = input[key];

  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  throw new CharacterPortError({
    reason: 'invalid-character-card',
    params: {
      field: key,
      detail: 'Expected a string or null field.',
    },
  });
}

function nullableStringField(input: Record<string, unknown>, key: string): string | null {
  const value = input[key];

  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  throw new CharacterPortError({
    reason: 'invalid-character-card',
    params: {
      field: key,
      detail: 'Expected a string or null field.',
    },
  });
}

function stringArrayField(input: Record<string, unknown>, key: string): string[] {
  const value = input[key];

  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value;
  }

  throw new CharacterPortError({
    reason: 'invalid-character-card',
    params: {
      field: key,
      detail: 'Expected an array value.',
    },
  });
}

function unknownArrayField(input: Record<string, unknown>, key: string): unknown[] {
  const value = input[key];

  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  throw new CharacterPortError({
    reason: 'invalid-character-card',
    params: {
      field: key,
      detail: 'Expected an array value.',
    },
  });
}

function stringRecordField(input: Record<string, unknown>, key: string): Record<string, string> {
  const value = input[key];

  if (value === undefined || value === null) {
    return {};
  }

  if (!isRecord(value)) {
    throw new CharacterPortError({
      reason: 'invalid-character-card',
      params: {
        field: key,
        detail: 'Expected a record of string values.',
      },
    });
  }

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => {
      if (typeof entryValue !== 'string') {
        throw new CharacterPortError({
          reason: 'invalid-character-card',
          params: {
            field: key,
            detail: 'Expected a record of string values.',
          },
        });
      }

      return [entryKey, entryValue];
    }),
  );
}

function unknownRecordField(input: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = input[key];

  if (value === undefined || value === null) {
    return {};
  }

  if (isRecord(value)) {
    return value;
  }

  throw new CharacterPortError({
    reason: 'invalid-character-card',
    params: {
      field: key,
      detail: 'Expected a record value.',
    },
  });
}

function objectOrNullField(
  input: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  const value = input[key];

  if (value === undefined || value === null) {
    return null;
  }

  if (isRecord(value)) {
    return value;
  }

  throw new CharacterPortError({
    reason: 'invalid-character-card',
    params: {
      field: key,
      detail: 'Expected an object value or null.',
    },
  });
}

function epochMillisField(input: Record<string, unknown>, key: string): number | null {
  const value = input[key];

  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function assignNonEmptyString(
  data: Record<string, unknown>,
  key: string,
  value: string | null,
): void {
  if (value !== null && value !== '') {
    data[key] = value;
  }
}

function assignNonEmptyRecord(
  data: Record<string, unknown>,
  key: string,
  value: Record<string, unknown>,
): void {
  if (Object.keys(value).length > 0) {
    data[key] = value;
  }
}

function assignNonEmptyArray(data: Record<string, unknown>, key: string, value: unknown[]): void {
  if (value.length > 0) {
    data[key] = value;
  }
}

function assignDefinedValue(data: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== null && value !== undefined) {
    data[key] = value;
  }
}

function importFileContent(fileName: string, content: Buffer): unknown {
  const normalizedFileName = fileName.toLowerCase();

  if (normalizedFileName.endsWith('.png')) {
    return readSillyTavernPngMetadata(content, fileName);
  }

  if (!normalizedFileName.endsWith('.json')) {
    throw new CharacterPortError({
      reason: 'invalid-import-file',
      params: {
        ...(fileName !== undefined ? { fileName } : {}),
        detail: 'Expected a PNG or JSON file.',
      },
    });
  }

  try {
    return JSON.parse(content.toString('utf8')) as unknown;
  } catch {
    throw new CharacterPortError({
      reason: 'invalid-import-file',
      params: {
        ...(fileName !== undefined ? { fileName } : {}),
        detail: 'Invalid JSON content.',
      },
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
