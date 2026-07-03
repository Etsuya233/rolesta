import type { CharacterVisibility } from './character-visibility.js';
import { ensureEpochMillis, type EpochMillis } from './epoch-millis.js';

export type CharacterCardSourceFormat = 'sillytavern_v1' | 'sillytavern_v2' | 'sillytavern_v3';

export interface CharacterCard {
  id: string;
  ownerUserId: string;
  visibility: CharacterVisibility;
  name: string;
  nickname: string | null;
  comment: string;
  tags: string[];
  version: string;
  creator: string | null;
  description: string;
  personality: string;
  scenario: string;
  firstMessage: string;
  alternateGreetings: string[];
  groupOnlyGreetings: string[];
  messageExample: string;
  creatorNotes: string;
  creatorNotesMultilingual: Record<string, string>;
  systemPrompt: string;
  postHistoryInstructions: string;
  characterBook: Record<string, unknown> | null;
  assets: unknown[];
  source: string[];
  metadata: Record<string, unknown>;
  sourceFormat: CharacterCardSourceFormat;
  sourceSnapshot: unknown;
  createdAtMs: EpochMillis;
  updatedAtMs: EpochMillis;
  creationDateMs: EpochMillis | null;
  modificationDateMs: EpochMillis | null;
  lastUsedAtMs: EpochMillis | null;
  usageCount: number;
}

export interface EmptyCharacterCardDraftRequest {
  id: string;
  ownerUserId: string;
  nowMs: number;
}

export function createEmptyCharacterCardDraft(request: EmptyCharacterCardDraftRequest): CharacterCard {
  const nowMs = ensureEpochMillis(request.nowMs);

  return {
    id: request.id,
    ownerUserId: request.ownerUserId,
    visibility: 'private',
    name: '',
    nickname: null,
    comment: '',
    tags: [],
    version: '',
    creator: null,
    description: '',
    personality: '',
    scenario: '',
    firstMessage: '',
    alternateGreetings: [],
    groupOnlyGreetings: [],
    messageExample: '',
    creatorNotes: '',
    creatorNotesMultilingual: {},
    systemPrompt: '',
    postHistoryInstructions: '',
    characterBook: null,
    assets: [],
    source: [],
    metadata: {},
    sourceFormat: 'sillytavern_v3',
    sourceSnapshot: {},
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
    creationDateMs: null,
    modificationDateMs: null,
    lastUsedAtMs: null,
    usageCount: 0,
  };
}
