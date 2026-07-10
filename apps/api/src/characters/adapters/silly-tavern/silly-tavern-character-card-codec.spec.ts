import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  fromSillyTavernCharacterCard,
  toSillyTavernCharacterCard,
} from './silly-tavern-character-card-codec.js';

describe('SillyTavern character card mapper', () => {
  it('imports the default SillyTavern character card', () => {
    const input = JSON.parse(
      readFileSync(
        resolve(
          process.cwd(),
          'test/fixtures/silly-tavern/st_default_character.json',
        ),
        'utf8',
      ),
    ) as unknown;
    const card = fromSillyTavernCharacterCard(
      input,
      'st_default_character.json',
    );

    expect(card).toMatchObject({
      sourceFormat: 'sillytavern_v3',
      name: 'Seraphina',
      creator: 'OtisAlejandro',
      version: '1.0.0',
      tags: [],
    });
    expect(card.firstMessage).toContain('You wake with a start');
    expect(card.characterBook).not.toBeNull();
  });

  it('imports V1 top-level fields', () => {
    const card = fromSillyTavernCharacterCard({
      name: 'Classic',
      description: 'Top level card',
      first_mes: 'Hello.',
      tags: ['legacy'],
    });

    expect(card).toMatchObject({
      sourceFormat: 'sillytavern_v1',
      name: 'Classic',
      description: 'Top level card',
      firstMessage: 'Hello.',
      tags: ['legacy'],
    });
  });

  it('imports V2 data fields', () => {
    const card = fromSillyTavernCharacterCard({
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        name: 'Seraphina',
        description: 'Forest guardian',
        personality: 'Gentle',
        scenario: 'Ancient grove',
        first_mes: 'Welcome, traveler.',
        mes_example: '<START>',
        creator_notes: 'Use a calm tone.',
        system_prompt: 'Stay in character.',
        post_history_instructions: 'Remember the grove.',
        alternate_greetings: ['The leaves whisper.'],
        tags: ['fantasy', 'healer'],
        creator: 'tester',
        character_version: '1.2',
        extensions: {},
      },
    });

    expect(card).toMatchObject({
      sourceFormat: 'sillytavern_v2',
      name: 'Seraphina',
      version: '1.2',
      tags: ['fantasy', 'healer'],
      firstMessage: 'Welcome, traveler.',
      alternateGreetings: ['The leaves whisper.'],
    });
  });

  it('imports V3 fields supported by the domain', () => {
    const card = fromSillyTavernCharacterCard({
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: {
        name: 'Nova',
        nickname: 'Pilot',
        description: 'Starship pilot',
        first_mes: 'Engines online.',
        creator_notes_multilingual: { zh: '飞行员' },
        group_only_greetings: ['Crew ready.'],
        assets: [{ type: 'icon', uri: 'asset://icon' }],
        source: ['manual'],
        creation_date: 1783090000000,
        modification_date: 1783090000100,
      },
    });

    expect(card).toMatchObject({
      sourceFormat: 'sillytavern_v3',
      nickname: 'Pilot',
      groupOnlyGreetings: ['Crew ready.'],
      creatorNotesMultilingual: { zh: '飞行员' },
      creationDateMs: 1783090000000,
      modificationDateMs: 1783090000100,
    });
  });

  it('exports only modeled fields as V3 by default', () => {
    const imported = fromSillyTavernCharacterCard({
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: { name: 'A', description: 'B', first_mes: 'C', extensions: { unknown: true } },
    });

    const exported = toSillyTavernCharacterCard(
      {
        ...imported,
        id: 'card_1',
        ownerUserId: 'user_1',
        visibility: 'private',
        createdAtMs: 1783090000000,
        updatedAtMs: 1783090000000,
        lastUsedAtMs: null,
        usageCount: 0,
      },
      'v3',
    );

    expect(exported.spec).toBe('chara_card_v3');
    expect(exported.data.name).toBe('A');
    expect(exported.data.first_mes).toBe('C');
    expect(exported.data.extensions).toBeUndefined();
  });

  it('exports modeled fields as V2 when requested', () => {
    const imported = fromSillyTavernCharacterCard({
      name: 'V2 Export',
      description: 'D',
      first_mes: 'F',
      alternate_greetings: ['Alt'],
    });

    const exported = toSillyTavernCharacterCard(
      {
        ...imported,
        id: 'card_1',
        ownerUserId: 'user_1',
        visibility: 'private',
        createdAtMs: 1783090000000,
        updatedAtMs: 1783090000000,
        lastUsedAtMs: null,
        usageCount: 0,
      },
      'v2',
    );

    expect(exported.spec).toBe('chara_card_v2');
    expect(exported.data.alternate_greetings).toEqual(['Alt']);
    expect(exported.data.group_only_greetings).toBeUndefined();
  });
});
