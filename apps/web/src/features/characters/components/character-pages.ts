export type CharacterPage =
  | { name: 'list'; key: 'characters:list' }
  | { name: 'create'; key: 'characters:create'; sessionKey: string }
  | {
      name: 'editMain';
      key: string;
      characterId: string;
      sessionKey: string;
    }
  | {
      name: 'alternateGreetings';
      key: string;
      characterId: string;
      sessionKey: string;
    }
  | { name: 'import'; key: 'characters:import' };

export const characterListPage: CharacterPage = {
  name: 'list',
  key: 'characters:list',
};

export function createCharacterPage(): CharacterPage {
  return {
    name: 'create',
    key: 'characters:create',
    sessionKey: 'characters:create',
  };
}

export function editCharacterPage(characterId: string): CharacterPage {
  return {
    name: 'editMain',
    key: `character:${characterId}:edit`,
    characterId,
    sessionKey: characterSessionKey(characterId),
  };
}

export function alternateGreetingsPage(characterId: string, sessionKey: string): CharacterPage {
  return {
    name: 'alternateGreetings',
    key: `${sessionKey}:alternateGreetings`,
    characterId,
    sessionKey,
  };
}

export function importCharacterPage(): CharacterPage {
  return { name: 'import', key: 'characters:import' };
}

export function characterSessionKey(characterId: string): string {
  return `character:${characterId}`;
}
