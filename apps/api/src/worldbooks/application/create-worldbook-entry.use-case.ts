import { countPromptTokens } from '@rolesta/shared';
import { UseCase } from '../../common/errors/index.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type {
  Worldbook,
  WorldbookEntryRole,
  WorldbookEntry,
  WorldbookInsertionPosition,
  WorldbookSelectiveLogic,
} from '../domain/worldbook.js';
import { translateWorldbookError } from './worldbook-error.mapper.js';
import { WorldbookApplicationError } from './worldbook-application-error.js';
import type { WorldbookClock, WorldbookIdGenerator } from './worldbook-application-services.js';
import type { WorldbookStore } from '../ports/worldbook-store.js';

export interface CreateWorldbookEntryCommand {
  worldbookId: string;
  viewerUserId: string;
  enabled?: boolean;
  name: string;
  comment?: string;
  content: string;
  primaryKeys?: string[];
  secondaryKeys?: string[];
  selective?: boolean;
  selectiveLogic?: WorldbookSelectiveLogic;
  constant?: boolean;
  vectorized?: boolean;
  ignoreBudget?: boolean;
  useProbability?: boolean;
  caseSensitive?: boolean | null;
  matchWholeWords?: boolean | null;
  matchPersonaDescription?: boolean;
  matchCharacterDescription?: boolean;
  matchCharacterPersonality?: boolean;
  matchCharacterDepthPrompt?: boolean;
  matchScenario?: boolean;
  matchCreatorNotes?: boolean;
  insertionPosition?: WorldbookInsertionPosition;
  insertionOrder?: number;
  depth?: number;
  insertionRole?: WorldbookEntryRole;
  anchorName?: string;
  scanDepth?: number | null;
  excludeRecursion?: boolean;
  preventRecursion?: boolean;
  delayUntilRecursion?: number;
  group?: string;
  groupOverride?: boolean;
  groupWeight?: number;
  useGroupScoring?: boolean | null;
  sticky?: number | null;
  cooldown?: number | null;
  delay?: number | null;
  characterFilterNames?: string[];
  characterFilterTags?: string[];
  characterFilterExclude?: boolean;
  triggers?: WorldbookEntry['triggers'];
  automationId?: string;
  addMemo?: boolean;
  probability?: number;
}

export class CreateWorldbookEntryUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly idGenerator: WorldbookIdGenerator,
    private readonly clock: WorldbookClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translateWorldbookError)
  async execute(command: CreateWorldbookEntryCommand): Promise<Worldbook> {
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

      const nowMs = ensureEpochMillis(this.clock.now().getTime());
      const displayIndex =
        current.entries.reduce((max, entry) => Math.max(max, entry.displayIndex), -1) + 1;
      const entry: WorldbookEntry = {
        id: this.idGenerator.createId(),
        worldbookId: current.id,
        enabled: command.enabled ?? true,
        name: command.name,
        comment: command.comment ?? '',
        content: command.content,
        primaryKeys: command.primaryKeys ?? [],
        secondaryKeys: command.secondaryKeys ?? [],
        selective: command.selective ?? false,
        selectiveLogic: command.selectiveLogic ?? 'andAny',
        constant: command.constant ?? false,
        vectorized: command.vectorized ?? false,
        ignoreBudget: command.ignoreBudget ?? false,
        useProbability: command.useProbability ?? true,
        caseSensitive: command.caseSensitive === undefined ? null : command.caseSensitive,
        matchWholeWords: command.matchWholeWords === undefined ? null : command.matchWholeWords,
        matchPersonaDescription: command.matchPersonaDescription ?? false,
        matchCharacterDescription: command.matchCharacterDescription ?? false,
        matchCharacterPersonality: command.matchCharacterPersonality ?? false,
        matchCharacterDepthPrompt: command.matchCharacterDepthPrompt ?? false,
        matchScenario: command.matchScenario ?? false,
        matchCreatorNotes: command.matchCreatorNotes ?? false,
        insertionPosition: command.insertionPosition ?? 'beforeCharacterDefinition',
        insertionOrder: command.insertionOrder ?? 100,
        displayIndex,
        depth: command.depth ?? 4,
        insertionRole: command.insertionRole ?? 'system',
        anchorName: command.anchorName ?? '',
        scanDepth: command.scanDepth === undefined ? null : command.scanDepth,
        excludeRecursion: command.excludeRecursion ?? false,
        preventRecursion: command.preventRecursion ?? false,
        delayUntilRecursion: command.delayUntilRecursion ?? 0,
        group: command.group ?? '',
        groupOverride: command.groupOverride ?? false,
        groupWeight: command.groupWeight ?? 100,
        useGroupScoring: command.useGroupScoring === undefined ? null : command.useGroupScoring,
        sticky: command.sticky === undefined ? null : command.sticky,
        cooldown: command.cooldown === undefined ? null : command.cooldown,
        delay: command.delay === undefined ? null : command.delay,
        characterFilterNames: command.characterFilterNames ?? [],
        characterFilterTags: command.characterFilterTags ?? [],
        characterFilterExclude: command.characterFilterExclude ?? false,
        triggers: command.triggers ?? [],
        automationId: command.automationId ?? '',
        addMemo: command.addMemo ?? false,
        probability: command.probability ?? 100,
        tokenCount: countPromptTokens(command.content),
        createdAtMs: nowMs,
        updatedAtMs: nowMs,
      };
      const updated = {
        ...current,
        entries: [...current.entries, entry],
        updatedAtMs: nowMs,
      };

      await this.store.update(updated);

      return updated;
    });
  }
}
