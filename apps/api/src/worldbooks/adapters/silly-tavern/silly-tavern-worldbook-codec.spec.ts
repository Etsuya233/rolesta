import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Worldbook } from '../../domain/worldbook.js';
import { WorldbookPortError } from '../../ports/worldbook-port-error.js';
import {
  fromSillyTavernWorldInfo,
  toSillyTavernWorldInfo,
} from './silly-tavern-worldbook-codec.js';

describe('SillyTavern world info mapper', () => {
  it('imports object entries from the default SillyTavern worldbook', () => {
    const input = JSON.parse(
      readFileSync(
        resolve(process.cwd(), 'test/fixtures/silly-tavern/st_default_worldbook.json'),
        'utf8',
      ),
    ) as unknown;
    const worldbook = fromSillyTavernWorldInfo(input, 'st_default_worldbook.json');

    expect(worldbook.name).toBe('st_default_worldbook');
    expect(worldbook.entries).toHaveLength(4);
    expect(worldbook.sourceSnapshot).toBe(input);
    expect(worldbook.entries[0]).toMatchObject({
      enabled: true,
      name: 'eldoria',
      primaryKeys: ['eldoria', 'wood', 'forest', 'magical forest'],
      secondaryKeys: [],
      constant: false,
      vectorized: false,
      selective: true,
      caseSensitive: false,
      matchWholeWords: false,
      insertionPosition: 'beforeCharacterDefinition',
      selectiveLogic: 'andAny',
      insertionRole: 'system',
      scanDepth: null,
      excludeRecursion: false,
      preventRecursion: false,
      delayUntilRecursion: false,
      insertionOrder: 0,
      depth: 4,
      probability: 100,
    });
    expect(worldbook.entries[0]?.tokenCount).toBeGreaterThan(0);
  });

  it('imports array entries and core editable fields', () => {
    const worldbook = fromSillyTavernWorldInfo(
      {
        name: 'Array book',
        description: 'Lore',
        tags: ['setting'],
        scanDepth: 5,
        tokenBudget: 800,
        recursiveScan: true,
        entries: [
          {
            name: 'Gate',
            comment: 'Gate comment',
            content: 'A silver gate.',
            key: ['gate'],
            keysecondary: ['silver'],
            disable: true,
            constant: true,
            vectorized: true,
            selective: true,
            caseSensitive: true,
            matchWholeWords: true,
            position: 2,
            role: 2,
            selectiveLogic: 3,
            order: 7,
            depth: 3,
            scanDepth: 6,
            excludeRecursion: true,
            preventRecursion: true,
            delayUntilRecursion: true,
            outletName: 'gate-anchor',
            probability: 40,
            unsupported: 'snapshot only',
          },
        ],
      },
      'ignored.json',
    );

    expect(worldbook).toMatchObject({
      name: 'Array book',
      description: 'Lore',
      tags: ['setting'],
      scanDepth: 5,
      tokenBudget: 800,
      recursiveScan: true,
    });
    expect(worldbook.entries[0]).toMatchObject({
      enabled: false,
      name: 'Gate',
      comment: 'Gate comment',
      primaryKeys: ['gate'],
      secondaryKeys: ['silver'],
      insertionPosition: 'beforeAuthorsNote',
      insertionRole: 'assistant',
      selectiveLogic: 'andAll',
      vectorized: true,
      scanDepth: 6,
      excludeRecursion: true,
      preventRecursion: true,
      delayUntilRecursion: true,
      anchorName: 'gate-anchor',
      insertionOrder: 7,
    });
    expect(worldbook.entries[0]).not.toHaveProperty('unsupported');
  });

  it('imports compatible extension fields', () => {
    const worldbook = fromSillyTavernWorldInfo(
      {
        entries: [
          {
            comment: 'Anchor',
            content: 'Anchored lore.',
            extensions: {
              position: 7,
              role: 1,
              selectiveLogic: 2,
              vectorized: true,
              scan_depth: 9,
              exclude_recursion: true,
              prevent_recursion: true,
              delay_until_recursion: true,
              outlet_name: 'anchor-slot',
            },
          },
        ],
      },
      'anchors.json',
    );

    expect(worldbook.entries[0]).toMatchObject({
      insertionPosition: 'atAnchor',
      insertionRole: 'user',
      selectiveLogic: 'notAny',
      vectorized: true,
      scanDepth: 9,
      excludeRecursion: true,
      preventRecursion: true,
      delayUntilRecursion: true,
      anchorName: 'anchor-slot',
    });
  });

  it('rejects missing or malformed entries', () => {
    expect(() => fromSillyTavernWorldInfo({}, 'book.json')).toThrow(WorldbookPortError);
    expect(() => fromSillyTavernWorldInfo({ entries: [{ content: 42 }] }, 'book.json')).toThrow(
      WorldbookPortError,
    );
  });

  it('exports SillyTavern compatible core fields without source snapshot merging', () => {
    const worldbook: Worldbook = {
      id: 'book-1',
      ownerUserId: 'owner',
      visibility: 'private',
      name: 'Exported',
      description: '',
      tags: [],
      scanDepth: 3,
      tokenBudget: 1024,
      recursiveScan: false,
      sourceFormat: 'sillytavern_world_info',
      sourceSnapshot: { providerOnly: true },
      createdAtMs: 1,
      updatedAtMs: 1,
      lastUsedAtMs: null,
      usageCount: 0,
      entries: [
        {
          id: 'entry-1',
          worldbookId: 'book-1',
          enabled: true,
          name: 'Main',
          comment: 'Main comment',
          content: 'Lore',
          primaryKeys: ['lore'],
          secondaryKeys: [],
          selective: false,
          constant: true,
          vectorized: true,
          caseSensitive: false,
          matchWholeWords: true,
          selectiveLogic: 'notAll',
          insertionPosition: 'atDepth',
          insertionOrder: 2,
          depth: 4,
          insertionRole: 'assistant',
          anchorName: 'slot',
          scanDepth: 8,
          excludeRecursion: true,
          preventRecursion: true,
          delayUntilRecursion: true,
          probability: 100,
          tokenCount: 1,
          createdAtMs: 1,
          updatedAtMs: 1,
        },
      ],
    };

    const output = toSillyTavernWorldInfo(worldbook);

    expect(output.name).toBe('Exported');
    expect(output.entries['0']).toMatchObject({
      key: ['lore'],
      comment: 'Main comment',
      disable: false,
      constant: true,
      vectorized: true,
      matchWholeWords: true,
      position: 4,
      role: 2,
      selectiveLogic: 1,
      scanDepth: 8,
      excludeRecursion: true,
      preventRecursion: true,
      delayUntilRecursion: true,
      outletName: 'slot',
    });
    expect(output).not.toHaveProperty('providerOnly');
  });
});
