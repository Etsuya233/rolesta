import type { CharacterCard } from '../domain/character-card.js';
import type { CharacterVisibility } from '../domain/character-visibility.js';

export interface CharacterCardEditableFields {
  visibility?: CharacterVisibility;
  name?: string;
  nickname?: string | null;
  comment?: string;
  tags?: string[];
  version?: string;
  creator?: string | null;
  description?: string;
  personality?: string;
  scenario?: string;
  firstMessage?: string;
  alternateGreetings?: string[];
  groupOnlyGreetings?: string[];
  messageExample?: string;
  creatorNotes?: string;
  creatorNotesMultilingual?: Record<string, string>;
  systemPrompt?: string;
  postHistoryInstructions?: string;
  characterBook?: Record<string, unknown> | null;
  assets?: unknown[];
  source?: string[];
  metadata?: Record<string, unknown>;
}

export function applyCharacterCardEditableFields(
  card: CharacterCard,
  fields: CharacterCardEditableFields,
): CharacterCard {
  return {
    ...card,
    ...(fields.visibility !== undefined ? { visibility: fields.visibility } : {}),
    ...(fields.name !== undefined ? { name: fields.name } : {}),
    ...(fields.nickname !== undefined ? { nickname: fields.nickname } : {}),
    ...(fields.comment !== undefined ? { comment: fields.comment } : {}),
    ...(fields.tags !== undefined ? { tags: fields.tags } : {}),
    ...(fields.version !== undefined ? { version: fields.version } : {}),
    ...(fields.creator !== undefined ? { creator: fields.creator } : {}),
    ...(fields.description !== undefined ? { description: fields.description } : {}),
    ...(fields.personality !== undefined ? { personality: fields.personality } : {}),
    ...(fields.scenario !== undefined ? { scenario: fields.scenario } : {}),
    ...(fields.firstMessage !== undefined ? { firstMessage: fields.firstMessage } : {}),
    ...(fields.alternateGreetings !== undefined ? { alternateGreetings: fields.alternateGreetings } : {}),
    ...(fields.groupOnlyGreetings !== undefined ? { groupOnlyGreetings: fields.groupOnlyGreetings } : {}),
    ...(fields.messageExample !== undefined ? { messageExample: fields.messageExample } : {}),
    ...(fields.creatorNotes !== undefined ? { creatorNotes: fields.creatorNotes } : {}),
    ...(fields.creatorNotesMultilingual !== undefined
      ? { creatorNotesMultilingual: fields.creatorNotesMultilingual }
      : {}),
    ...(fields.systemPrompt !== undefined ? { systemPrompt: fields.systemPrompt } : {}),
    ...(fields.postHistoryInstructions !== undefined
      ? { postHistoryInstructions: fields.postHistoryInstructions }
      : {}),
    ...(fields.characterBook !== undefined ? { characterBook: fields.characterBook } : {}),
    ...(fields.assets !== undefined ? { assets: fields.assets } : {}),
    ...(fields.source !== undefined ? { source: fields.source } : {}),
    ...(fields.metadata !== undefined ? { metadata: fields.metadata } : {}),
  };
}
