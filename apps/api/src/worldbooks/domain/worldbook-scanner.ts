import { countPromptTokens } from '@rolesta/shared';
import type {
  WorldbookActivatedEntry,
  WorldbookEntryRef,
  WorldbookEntryRuntimeState,
  WorldbookEntryTrace,
  WorldbookRandomTrace,
  WorldbookRuntimeState,
  WorldbookScanContext,
  WorldbookScanEntry,
  WorldbookScanInsertions,
  WorldbookScanResult,
  WorldbookScanSource,
  WorldbookScanState,
  WorldbookTimedEffect,
} from '../contracts/worldbook-scanning.js';
import { uniqueWorldbookScanSources } from '../contracts/worldbook-scanning.js';

const MAX_SCAN_DEPTH = 1000;

interface PreparedEntry {
  source: WorldbookScanSource;
  entry: WorldbookScanEntry;
  ref: WorldbookEntryRef;
  content: string;
  decorators: string[];
  fingerprint: string;
}

interface Candidate {
  prepared: PreparedEntry;
  reason: string;
  matchedPrimaryKey?: string;
  matchedSecondaryKeys?: string[];
}

interface ActiveTimedEffects {
  stickyRefs: Set<string>;
  cooldownRefs: Set<string>;
  states: Map<string, WorldbookEntryRuntimeState>;
}

export class WorldbookScanner {
  scan(context: WorldbookScanContext): WorldbookScanResult {
    const preparedEntries = sortedPreparedEntries(
      context.sources,
      context.settings.characterLoreInsertionStrategy,
    );
    const entryByRef = new Map(preparedEntries.map((entry) => [refKey(entry.ref), entry]));
    const timedEffects = activeTimedEffects(
      context.runtimeState,
      entryByRef,
      context.historyMessageCount,
    );
    const history = [...context.history]
      .reverse()
      .slice(0, MAX_SCAN_DEPTH)
      .map((message) =>
        context.settings.includeNames ? `${message.name}: ${message.content}` : message.content,
      );
    const traceEntries: WorldbookEntryTrace[] = [];
    const randomSamples: WorldbookRandomTrace[] = [];
    const iterations: WorldbookScanResult['trace']['iterations'] = [];
    const activated = new Map<string, PreparedEntry>();
    const failedProbability = new Set<string>();
    const recursionBuffer: string[] = [];
    const delayedLevels = [
      ...new Set(
        preparedEntries.map(({ entry }) => entry.delayUntilRecursion).filter((level) => level > 0),
      ),
    ].sort((left, right) => left - right);
    let currentDelayedLevel = delayedLevels.shift() ?? 0;
    let scanDepthSkew = 0;
    let state: WorldbookScanState | null = 'initial';
    let iteration = 0;
    let overflowed = false;
    let allActivatedText = '';
    let budget = Math.round((context.settings.budgetPercent * context.maxContextTokens) / 100) || 1;

    if (context.settings.budgetCap > 0 && budget > context.settings.budgetCap) {
      budget = context.settings.budgetCap;
    }

    while (state !== null) {
      if (
        context.settings.maxRecursionSteps > 0 &&
        iteration >= context.settings.maxRecursionSteps
      ) {
        break;
      }

      iteration += 1;
      const currentState = state;
      const candidates: Candidate[] = [];

      for (const prepared of preparedEntries) {
        const key = refKey(prepared.ref);

        if (failedProbability.has(key) || activated.has(key)) {
          continue;
        }

        const candidate = evaluateEntry({
          prepared,
          state: currentState,
          context,
          history,
          scanDepthSkew,
          recursionBuffer,
          timedEffects,
          currentDelayedLevel,
          traceEntries,
          iteration,
        });

        if (candidate) {
          candidates.push(candidate);
        }
      }

      candidates.sort((left, right) => {
        const leftSticky = timedEffects.stickyRefs.has(refKey(left.prepared.ref)) ? 1 : 0;
        const rightSticky = timedEffects.stickyRefs.has(refKey(right.prepared.ref)) ? 1 : 0;
        return (
          rightSticky - leftSticky ||
          preparedEntries.indexOf(left.prepared) - preparedEntries.indexOf(right.prepared)
        );
      });

      filterInclusionGroups({
        candidates,
        activated,
        context,
        history,
        scanDepthSkew,
        recursionBuffer,
        state: currentState,
        timedEffects,
        randomSamples,
        traceEntries,
        iteration,
      });

      const successful: Candidate[] = [];
      const activatedThisIteration: WorldbookEntryRef[] = [];
      let pendingContent = '';
      const existingRecursionTokens = countPromptTokens(allActivatedText);
      let remainingIgnoreBudget = candidates.filter(
        ({ prepared }) => prepared.entry.ignoreBudget,
      ).length;

      for (const candidate of candidates) {
        const { prepared } = candidate;
        const key = refKey(prepared.ref);
        remainingIgnoreBudget -= prepared.entry.ignoreBudget ? 1 : 0;

        if (overflowed && !prepared.entry.ignoreBudget) {
          if (remainingIgnoreBudget > 0) {
            continue;
          }
          break;
        }

        if (
          prepared.entry.useProbability &&
          prepared.entry.probability !== 100 &&
          !timedEffects.stickyRefs.has(key)
        ) {
          const value = context.random.next() * 100;
          const accepted = value <= prepared.entry.probability;
          randomSamples.push({
            purpose: 'probability',
            value,
            threshold: prepared.entry.probability,
            ref: prepared.ref,
          });

          if (!accepted) {
            failedProbability.add(key);
            traceEntries.push(
              entryTrace(iteration, currentState, prepared.ref, 'rejected', 'probability'),
            );
            continue;
          }
        }

        successful.push(candidate);
        pendingContent += `${prepared.content}\n`;

        if (
          !prepared.entry.ignoreBudget &&
          existingRecursionTokens + countPromptTokens(pendingContent) >= budget
        ) {
          overflowed = true;
          traceEntries.push(
            entryTrace(iteration, currentState, prepared.ref, 'rejected', 'budget'),
          );
          continue;
        }

        activated.set(key, prepared);
        activatedThisIteration.push(prepared.ref);
        traceEntries.push(
          entryTrace(
            iteration,
            currentState,
            prepared.ref,
            'activated',
            candidate.reason,
            candidate.matchedPrimaryKey,
            candidate.matchedSecondaryKeys,
          ),
        );
      }

      const recursiveEntries = successful.filter(
        ({ prepared }) => !prepared.entry.preventRecursion,
      );
      let nextState: WorldbookScanState | null = null;

      if (context.settings.recursive && !overflowed && recursiveEntries.length > 0) {
        nextState = 'recursion';
      }

      if (
        context.settings.recursive &&
        !overflowed &&
        currentState === 'minActivations' &&
        recursionBuffer.length > 0
      ) {
        nextState = 'recursion';
      }

      if (
        nextState === null &&
        !overflowed &&
        context.settings.minActivations > 0 &&
        activated.size < context.settings.minActivations
      ) {
        const nextDepth = context.settings.scanDepth + scanDepthSkew;
        const overMaximum =
          (context.settings.minActivationsDepthMax > 0 &&
            nextDepth > context.settings.minActivationsDepthMax) ||
          nextDepth > history.length;

        if (!overMaximum) {
          scanDepthSkew += 1;
          nextState = 'minActivations';
        }
      }

      if (nextState === null && delayedLevels.length > 0) {
        currentDelayedLevel = delayedLevels.shift()!;
        nextState = 'recursion';
      }

      if (nextState !== null) {
        const recursiveContent = recursiveEntries
          .map(({ prepared }) => prepared.content)
          .join('\n');
        if (recursiveContent) {
          recursionBuffer.push(recursiveContent);
          allActivatedText = `${recursiveContent}\n${allActivatedText}`;
        }
      }

      iterations.push({
        iteration,
        state: currentState,
        nextState,
        activatedRefs: activatedThisIteration,
      });
      state = nextState;
    }

    const activatedEntries = [...activated.values()]
      .sort((left, right) => left.entry.insertionOrder - right.entry.insertionOrder)
      .map(toActivatedEntry);
    const nextRuntimeState = updatedRuntimeState(
      timedEffects.states,
      activated.values(),
      context.historyMessageCount,
    );

    return {
      activatedEntries,
      insertions: buildInsertions(activatedEntries),
      nextRuntimeState,
      trace: {
        iterations,
        entries: traceEntries,
        randomSamples,
        budget: {
          limit: budget,
          used: countPromptTokens(activatedEntries.map((entry) => entry.content).join('\n')),
          overflowed,
        },
      },
    };
  }
}

function evaluateEntry(input: {
  prepared: PreparedEntry;
  state: WorldbookScanState;
  context: WorldbookScanContext;
  history: string[];
  scanDepthSkew: number;
  recursionBuffer: string[];
  timedEffects: ActiveTimedEffects;
  currentDelayedLevel: number;
  traceEntries: WorldbookEntryTrace[];
  iteration: number;
}): Candidate | null {
  const { prepared, state, context, timedEffects, traceEntries, iteration } = input;
  const { entry, ref } = prepared;
  const key = refKey(ref);
  const sticky = timedEffects.stickyRefs.has(key);
  const skip = (reason: string): null => {
    traceEntries.push(entryTrace(iteration, state, ref, 'skipped', reason));
    return null;
  };
  const activate = (candidate: Omit<Candidate, 'prepared'>): Candidate => {
    return { prepared, ...candidate };
  };

  if (!entry.enabled) return skip('disabled');
  if (entry.triggers.length > 0 && !entry.triggers.includes(context.generationTrigger)) {
    return skip('generationTrigger');
  }
  if (filteredByCharacter(entry, context)) return skip('characterFilter');
  if (entry.delay !== null && context.historyMessageCount < entry.delay) return skip('delay');
  if (timedEffects.cooldownRefs.has(key) && !sticky) return skip('cooldown');
  if (state !== 'recursion' && entry.delayUntilRecursion > 0 && !sticky) {
    return skip('delayUntilRecursion');
  }
  if (state === 'recursion' && entry.delayUntilRecursion > input.currentDelayedLevel && !sticky) {
    return skip('delayUntilRecursionLevel');
  }
  if (state === 'recursion' && context.settings.recursive && entry.excludeRecursion && !sticky) {
    return skip('excludeRecursion');
  }
  if (prepared.decorators.includes('@@activate')) return activate({ reason: 'activateDecorator' });
  if (prepared.decorators.includes('@@dont_activate')) return skip('dontActivateDecorator');
  if (entry.constant) return activate({ reason: 'constant' });
  if (sticky) return activate({ reason: 'sticky' });
  if (entry.primaryKeys.length === 0) return skip('missingPrimaryKeys');

  const text = scanText(input);
  const primary = entry.primaryKeys.find((keyword) =>
    matchKeyword(text, keyword.trim(), entry, context),
  );
  if (!primary) return skip('primaryKeywords');

  if (!entry.selective || entry.secondaryKeys.length === 0) {
    return activate({ reason: 'primaryKeyword', matchedPrimaryKey: primary });
  }

  const matchedSecondary = entry.secondaryKeys.filter((keyword) =>
    matchKeyword(text, keyword.trim(), entry, context),
  );
  const matches =
    entry.selectiveLogic === 'andAny'
      ? matchedSecondary.length > 0
      : entry.selectiveLogic === 'notAll'
        ? matchedSecondary.length < entry.secondaryKeys.length
        : entry.selectiveLogic === 'notAny'
          ? matchedSecondary.length === 0
          : matchedSecondary.length === entry.secondaryKeys.length;

  return matches
    ? activate({
        reason: 'selectiveKeywords',
        matchedPrimaryKey: primary,
        matchedSecondaryKeys: matchedSecondary,
      })
    : skip('secondaryKeywords');
}

function filterInclusionGroups(input: {
  candidates: Candidate[];
  activated: Map<string, PreparedEntry>;
  context: WorldbookScanContext;
  history: string[];
  scanDepthSkew: number;
  recursionBuffer: string[];
  state: WorldbookScanState;
  timedEffects: ActiveTimedEffects;
  randomSamples: WorldbookRandomTrace[];
  traceEntries: WorldbookEntryTrace[];
  iteration: number;
}): void {
  const groups = new Map<string, Candidate[]>();
  for (const candidate of input.candidates) {
    for (const group of candidate.prepared.entry.group.split(/,\s*/).filter(Boolean)) {
      groups.set(group, [...(groups.get(group) ?? []), candidate]);
    }
  }

  const remove = (candidate: Candidate) => {
    const index = input.candidates.indexOf(candidate);
    if (index >= 0) {
      input.candidates.splice(index, 1);
      input.traceEntries.push(
        entryTrace(
          input.iteration,
          input.state,
          candidate.prepared.ref,
          'rejected',
          'group',
          candidate.matchedPrimaryKey,
          candidate.matchedSecondaryKeys,
        ),
      );
    }
  };

  for (const [groupName, originalGroup] of groups) {
    let group = originalGroup.filter((candidate) => input.candidates.includes(candidate));
    const sticky = group.filter((candidate) =>
      input.timedEffects.stickyRefs.has(refKey(candidate.prepared.ref)),
    );
    if (sticky.length > 0) {
      for (const candidate of group) if (!sticky.includes(candidate)) remove(candidate);
      continue;
    }

    group = group.filter((candidate) => input.candidates.includes(candidate));
    const scoringEnabled =
      input.context.settings.useGroupScoring ||
      group.some(({ prepared }) => prepared.entry.useGroupScoring === true);
    if (scoringEnabled && group.length > 0) {
      const scores = group.map((candidate) =>
        groupScore(
          candidate.prepared.entry,
          scanText({
            prepared: candidate.prepared,
            state: input.state,
            context: input.context,
            history: input.history,
            scanDepthSkew: input.scanDepthSkew,
            recursionBuffer: input.recursionBuffer,
          }),
          input.context,
        ),
      );
      const maximum = Math.max(...scores);
      for (let index = 0; index < group.length; index += 1) {
        const candidate = group[index]!;
        const enabled =
          candidate.prepared.entry.useGroupScoring ?? input.context.settings.useGroupScoring;
        if (enabled && scores[index]! < maximum) remove(candidate);
      }
    }

    group = group.filter((candidate) => input.candidates.includes(candidate));
    if ([...input.activated.values()].some(({ entry }) => entry.group === groupName)) {
      for (const candidate of group) remove(candidate);
      continue;
    }
    if (group.length <= 1) continue;

    const overrides = group
      .filter(({ prepared }) => prepared.entry.groupOverride)
      .sort(
        (left, right) => right.prepared.entry.insertionOrder - left.prepared.entry.insertionOrder,
      );
    if (overrides.length > 0) {
      for (const candidate of group) if (candidate !== overrides[0]) remove(candidate);
      continue;
    }

    const totalWeight = group.reduce(
      (total, candidate) => total + candidate.prepared.entry.groupWeight,
      0,
    );
    const value = input.context.random.next() * totalWeight;
    let cumulative = 0;
    let winner = group[0]!;
    for (const candidate of group) {
      cumulative += candidate.prepared.entry.groupWeight;
      if (value <= cumulative) {
        winner = candidate;
        break;
      }
    }
    input.randomSamples.push({
      purpose: 'group',
      value,
      threshold: totalWeight,
      group: groupName,
      acceptedRef: winner.prepared.ref,
    });
    for (const candidate of group) if (candidate !== winner) remove(candidate);
  }
}

function scanText(input: {
  prepared: PreparedEntry;
  state: WorldbookScanState;
  context: WorldbookScanContext;
  history: string[];
  scanDepthSkew: number;
  recursionBuffer: string[];
}): string {
  const { entry } = input.prepared;
  const depth = Math.min(
    entry.scanDepth ?? input.context.settings.scanDepth + input.scanDepthSkew,
    MAX_SCAN_DEPTH,
  );
  if (depth <= 0) return '';
  const values = input.history.slice(0, depth);
  if (entry.matchPersonaDescription && input.context.personaDescription)
    values.push(input.context.personaDescription);
  if (entry.matchCharacterDescription && input.context.character.description)
    values.push(input.context.character.description);
  if (entry.matchCharacterPersonality && input.context.character.personality)
    values.push(input.context.character.personality);
  if (entry.matchCharacterDepthPrompt && input.context.character.depthPrompt)
    values.push(input.context.character.depthPrompt);
  if (entry.matchScenario && input.context.character.scenario)
    values.push(input.context.character.scenario);
  if (entry.matchCreatorNotes && input.context.character.creatorNotes)
    values.push(input.context.character.creatorNotes);
  if (input.state !== 'minActivations') values.push(...input.recursionBuffer);
  return `\x01${values.join('\n\x01')}`;
}

function matchKeyword(
  text: string,
  keyword: string,
  entry: WorldbookScanEntry,
  context: WorldbookScanContext,
): boolean {
  const regex = regexKeyword(keyword);
  if (regex) return regex.test(text);
  const caseSensitive = entry.caseSensitive ?? context.settings.caseSensitive;
  const haystack = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? keyword : keyword.toLowerCase();
  const wholeWords = entry.matchWholeWords ?? context.settings.matchWholeWords;
  if (!wholeWords || needle.split(/\s+/).length > 1) return haystack.includes(needle);
  return new RegExp(`(?:^|\\W)(${escapeRegex(needle)})(?:$|\\W)`).test(haystack);
}

function regexKeyword(keyword: string): RegExp | null {
  const match = keyword.match(/^\/([\w\W]+?)\/([gimsuy]*)$/);
  if (!match || match[1]!.match(/(^|[^\\])\//)) return null;
  try {
    return new RegExp(match[1]!.replace('\\/', '/'), match[2]);
  } catch {
    return null;
  }
}

function groupScore(
  entry: WorldbookScanEntry,
  text: string,
  context: WorldbookScanContext,
): number {
  const primary = entry.primaryKeys.filter((keyword) =>
    matchKeyword(text, keyword, entry, context),
  ).length;
  if (primary === 0 || entry.secondaryKeys.length === 0) return primary;
  const secondary = entry.secondaryKeys.filter((keyword) =>
    matchKeyword(text, keyword, entry, context),
  ).length;
  if (entry.selectiveLogic === 'andAny') return primary + secondary;
  if (entry.selectiveLogic === 'andAll' && secondary === entry.secondaryKeys.length)
    return primary + secondary;
  return primary;
}

function filteredByCharacter(entry: WorldbookScanEntry, context: WorldbookScanContext): boolean {
  if (entry.characterFilterNames.length > 0) {
    const included = entry.characterFilterNames.includes(context.character.fileName);
    if (entry.characterFilterExclude ? included : !included) return true;
  }
  if (entry.characterFilterTags.length > 0) {
    const included = context.character.tags.some((tag) => entry.characterFilterTags.includes(tag));
    if (entry.characterFilterExclude ? included : !included) return true;
  }
  return false;
}

function sortedPreparedEntries(
  sources: WorldbookScanSource[],
  strategy: WorldbookScanContext['settings']['characterLoreInsertionStrategy'],
): PreparedEntry[] {
  const preparedByRole = (role: WorldbookScanSource['sourceRole']) =>
    uniqueWorldbookScanSources(sources)
      .filter((source) => source.sourceRole === role)
      .flatMap((source) => source.entries.map((entry) => prepareEntry(source, entry)))
      .sort((left, right) => right.entry.insertionOrder - left.entry.insertionOrder);
  const persona = preparedByRole('persona');
  const character = preparedByRole('character');
  const independent = preparedByRole('independent');
  if (strategy === 'characterFirst') return [...persona, ...character, ...independent];
  if (strategy === 'globalFirst') return [...persona, ...independent, ...character];
  return [...persona, ...character, ...independent].sort(
    (left, right) => right.entry.insertionOrder - left.entry.insertionOrder,
  );
}

function prepareEntry(source: WorldbookScanSource, entry: WorldbookScanEntry): PreparedEntry {
  const parsed = parseDecorators(entry.content);
  return {
    source,
    entry,
    ref: {
      sourceType: source.sourceType,
      sourceAssetId: source.sourceAssetId,
      entryId: entry.id,
    },
    content: parsed.content,
    decorators: parsed.decorators,
    fingerprint: scanFingerprint(entry),
  };
}

function parseDecorators(content: string): { decorators: string[]; content: string } {
  if (!content.startsWith('@@')) return { decorators: [], content };
  const lines = content.split('\n');
  const decorators: string[] = [];
  let fallback = false;
  let contentIndex = lines.length;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (!line.startsWith('@@')) {
      contentIndex = index;
      break;
    }
    if (line.startsWith('@@@') && !fallback) continue;
    const normalized = line.startsWith('@@@') ? line.slice(1) : line;
    if (normalized.startsWith('@@activate') || normalized.startsWith('@@dont_activate')) {
      decorators.push(normalized);
      fallback = false;
    } else {
      fallback = true;
    }
  }
  return { decorators, content: lines.slice(contentIndex).join('\n') };
}

function activeTimedEffects(
  runtimeState: WorldbookRuntimeState,
  entries: Map<string, PreparedEntry>,
  historyMessageCount: number,
): ActiveTimedEffects {
  const stickyRefs = new Set<string>();
  const cooldownRefs = new Set<string>();
  const states = new Map<string, WorldbookEntryRuntimeState>();

  for (const state of runtimeState.entries) {
    const key = refKey(state.ref);
    const prepared = entries.get(key);
    if (!prepared || state.fingerprint !== prepared.fingerprint) continue;
    const sticky = activeEffect(state.sticky, historyMessageCount);
    let cooldown = activeEffect(state.cooldown, historyMessageCount);
    if (
      state.sticky &&
      !sticky &&
      historyMessageCount >= state.sticky.endMessageCount &&
      prepared.entry.cooldown
    ) {
      cooldown = timedEffect(historyMessageCount, prepared.entry.cooldown, true);
    }
    if (sticky) stickyRefs.add(key);
    if (cooldown) cooldownRefs.add(key);
    if (sticky || cooldown) {
      states.set(key, {
        ref: state.ref,
        fingerprint: state.fingerprint,
        ...(sticky ? { sticky } : {}),
        ...(cooldown ? { cooldown } : {}),
      });
    }
  }

  return { stickyRefs, cooldownRefs, states };
}

function activeEffect(
  effect: WorldbookTimedEffect | undefined,
  historyMessageCount: number,
): WorldbookTimedEffect | undefined {
  if (!effect) return undefined;
  if (historyMessageCount <= effect.startMessageCount && !effect.protected) return undefined;
  return historyMessageCount >= effect.endMessageCount ? undefined : effect;
}

function updatedRuntimeState(
  states: Map<string, WorldbookEntryRuntimeState>,
  activated: Iterable<PreparedEntry>,
  historyMessageCount: number,
): WorldbookRuntimeState {
  for (const prepared of activated) {
    const key = refKey(prepared.ref);
    const current = states.get(key) ?? {
      ref: prepared.ref,
      fingerprint: prepared.fingerprint,
    };
    const sticky =
      current.sticky ??
      (prepared.entry.sticky
        ? timedEffect(historyMessageCount, prepared.entry.sticky, false)
        : undefined);
    const cooldown =
      current.cooldown ??
      (prepared.entry.cooldown
        ? timedEffect(historyMessageCount, prepared.entry.cooldown, false)
        : undefined);
    if (sticky || cooldown) {
      states.set(key, {
        ref: prepared.ref,
        fingerprint: prepared.fingerprint,
        ...(sticky ? { sticky } : {}),
        ...(cooldown ? { cooldown } : {}),
      });
    }
  }
  return { entries: [...states.values()] };
}

function timedEffect(
  start: number,
  duration: number,
  protectedEffect: boolean,
): WorldbookTimedEffect {
  return {
    startMessageCount: start,
    endMessageCount: start + duration,
    protected: protectedEffect,
  };
}

function buildInsertions(entries: WorldbookActivatedEntry[]): WorldbookScanInsertions {
  const insertions: WorldbookScanInsertions = {
    beforeCharacterDefinition: [],
    afterCharacterDefinition: [],
    beforeAuthorsNote: [],
    afterAuthorsNote: [],
    beforeExampleMessages: [],
    afterExampleMessages: [],
    atDepth: [],
    anchors: {},
  };
  for (const entry of entries) {
    if (entry.insertionPosition === 'atDepth') {
      let group = insertions.atDepth.find(
        (item) => item.depth === entry.depth && item.role === entry.insertionRole,
      );
      if (!group) {
        group = { depth: entry.depth, role: entry.insertionRole, entries: [] };
        insertions.atDepth.push(group);
      }
      group.entries.push(entry);
    } else if (entry.insertionPosition === 'atAnchor') {
      insertions.anchors[entry.anchorName] = [
        entry,
        ...(insertions.anchors[entry.anchorName] ?? []),
      ];
    } else if (entry.insertionPosition !== 'unknown') {
      insertions[entry.insertionPosition].push(entry);
    }
  }
  return insertions;
}

function toActivatedEntry(prepared: PreparedEntry): WorldbookActivatedEntry {
  return {
    ref: prepared.ref,
    sourceName: prepared.source.name,
    name: prepared.entry.name,
    content: prepared.content,
    insertionPosition: prepared.entry.insertionPosition,
    insertionOrder: prepared.entry.insertionOrder,
    depth: prepared.entry.depth,
    insertionRole: prepared.entry.insertionRole,
    anchorName: prepared.entry.anchorName,
  };
}

function scanFingerprint(entry: WorldbookScanEntry): string {
  return JSON.stringify({
    enabled: entry.enabled,
    content: entry.content,
    primaryKeys: entry.primaryKeys,
    secondaryKeys: entry.secondaryKeys,
    selective: entry.selective,
    selectiveLogic: entry.selectiveLogic,
    constant: entry.constant,
    ignoreBudget: entry.ignoreBudget,
    useProbability: entry.useProbability,
    caseSensitive: entry.caseSensitive,
    matchWholeWords: entry.matchWholeWords,
    matchPersonaDescription: entry.matchPersonaDescription,
    matchCharacterDescription: entry.matchCharacterDescription,
    matchCharacterPersonality: entry.matchCharacterPersonality,
    matchCharacterDepthPrompt: entry.matchCharacterDepthPrompt,
    matchScenario: entry.matchScenario,
    matchCreatorNotes: entry.matchCreatorNotes,
    scanDepth: entry.scanDepth,
    excludeRecursion: entry.excludeRecursion,
    preventRecursion: entry.preventRecursion,
    delayUntilRecursion: entry.delayUntilRecursion,
    group: entry.group,
    groupOverride: entry.groupOverride,
    groupWeight: entry.groupWeight,
    useGroupScoring: entry.useGroupScoring,
    sticky: entry.sticky,
    cooldown: entry.cooldown,
    delay: entry.delay,
    characterFilterNames: entry.characterFilterNames,
    characterFilterTags: entry.characterFilterTags,
    characterFilterExclude: entry.characterFilterExclude,
    triggers: entry.triggers,
    probability: entry.probability,
  });
}

function entryTrace(
  iteration: number,
  state: WorldbookScanState,
  ref: WorldbookEntryRef,
  outcome: WorldbookEntryTrace['outcome'],
  reason: string,
  matchedPrimaryKey?: string,
  matchedSecondaryKeys?: string[],
): WorldbookEntryTrace {
  return {
    iteration,
    state,
    ref,
    outcome,
    reason,
    ...(matchedPrimaryKey ? { matchedPrimaryKey } : {}),
    ...(matchedSecondaryKeys ? { matchedSecondaryKeys } : {}),
  };
}

function refKey(ref: WorldbookEntryRef): string {
  return `${ref.sourceType}:${ref.sourceAssetId}:${ref.entryId}`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
