import { countPromptTokens } from '@rolesta/shared';
import { UseCase } from '../../common/errors/index.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type {
  Worldbook,
  WorldbookEntryRole,
  WorldbookInsertionPosition,
  WorldbookSelectiveLogic,
  WorldbookVisibility,
} from '../domain/worldbook.js';
import type { WorldbookStore } from '../ports/worldbook-store.js';
import type { WorldbookClock, WorldbookIdGenerator } from './worldbook-application-services.js';
import { WorldbookApplicationError } from './worldbook-application-error.js';
import { translateWorldbookError } from './worldbook-error.mapper.js';

export interface WorldbookDocumentEntry {
  id: string;
  enabled: boolean;
  name: string;
  comment: string;
  content: string;
  primaryKeys: string[];
  secondaryKeys: string[];
  selective: boolean;
  selectiveLogic: WorldbookSelectiveLogic;
  constant: boolean;
  vectorized: boolean;
  ignoreBudget: boolean;
  useProbability: boolean;
  caseSensitive: boolean | null;
  matchWholeWords: boolean | null;
  matchPersonaDescription: boolean;
  matchCharacterDescription: boolean;
  matchCharacterPersonality: boolean;
  matchCharacterDepthPrompt: boolean;
  matchScenario: boolean;
  matchCreatorNotes: boolean;
  insertionPosition: WorldbookInsertionPosition;
  insertionOrder: number;
  depth: number;
  insertionRole: WorldbookEntryRole;
  anchorName: string;
  scanDepth: number | null;
  excludeRecursion: boolean;
  preventRecursion: boolean;
  delayUntilRecursion: number;
  group: string;
  groupOverride: boolean;
  groupWeight: number;
  useGroupScoring: boolean | null;
  sticky: number | null;
  cooldown: number | null;
  delay: number | null;
  characterFilterNames: string[];
  characterFilterTags: string[];
  characterFilterExclude: boolean;
  triggers: Worldbook['entries'][number]['triggers'];
  automationId: string;
  addMemo: boolean;
  probability: number;
}

export interface UpdateWorldbookDocumentCommand {
  worldbookId: string;
  viewerUserId: string;
  visibility: WorldbookVisibility;
  name: string;
  description: string;
  tags: string[];
  entries: WorldbookDocumentEntry[];
}

export class UpdateWorldbookDocumentUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly idGenerator: WorldbookIdGenerator,
    private readonly clock: WorldbookClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translateWorldbookError)
  async execute(command: UpdateWorldbookDocumentCommand): Promise<Worldbook> {
    return this.unitOfWork.run(async () => {
      const current = await this.store.findVisibleById(command.worldbookId, command.viewerUserId);

      if (current === null) {
        throw new WorldbookApplicationError({
          reason: 'not-found',
          params: { worldbookId: command.worldbookId },
        });
      }

      if (current.ownerUserId !== command.viewerUserId) {
        throw new WorldbookApplicationError({
          reason: 'forbidden',
          params: {
            worldbookId: command.worldbookId,
            viewerUserId: command.viewerUserId,
          },
        });
      }

      assertUniqueEntryIds(command.worldbookId, command.entries);

      const nowMs = ensureEpochMillis(this.clock.now().getTime());
      const currentEntryById = new Map(current.entries.map((entry) => [entry.id, entry]));
      const entries = command.entries.map((entry, displayIndex) => {
        const existing = currentEntryById.get(entry.id);

        return {
          ...entry,
          id: existing?.id ?? this.idGenerator.createId(),
          worldbookId: current.id,
          displayIndex,
          tokenCount: countPromptTokens(entry.content),
          createdAtMs: existing?.createdAtMs ?? nowMs,
          updatedAtMs: nowMs,
        };
      });
      const updated: Worldbook = {
        ...current,
        visibility: command.visibility,
        name: command.name,
        description: command.description,
        tags: command.tags,
        entries,
        updatedAtMs: nowMs,
      };

      await this.store.update(updated);
      return updated;
    });
  }
}

function assertUniqueEntryIds(worldbookId: string, entries: WorldbookDocumentEntry[]): void {
  const entryIds = new Set<string>();

  for (const entry of entries) {
    if (entryIds.has(entry.id)) {
      throw new WorldbookApplicationError({
        reason: 'duplicate-entry',
        params: { worldbookId, entryId: entry.id },
      });
    }

    entryIds.add(entry.id);
  }
}
