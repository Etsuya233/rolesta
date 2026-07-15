export type WorldbookPage =
  | { name: 'list'; key: 'worldbooks:list' }
  | { name: 'create'; key: 'worldbooks:create'; sessionKey: string }
  | { name: 'editMain'; key: string; worldbookId: string; sessionKey: string }
  | { name: 'entryList'; key: string; worldbookId: string; sessionKey: string }
  | {
      name: 'entryCreate';
      key: string;
      worldbookId: string;
      sessionKey: string;
    }
  | {
      name: 'entryEdit';
      key: string;
      worldbookId: string;
      entryId: string;
      sessionKey: string;
    }
  | { name: 'import'; key: 'worldbooks:import' };

export const worldbookListPage: WorldbookPage = {
  name: 'list',
  key: 'worldbooks:list',
};

export function createWorldbookPage(): WorldbookPage {
  return {
    name: 'create',
    key: 'worldbooks:create',
    sessionKey: 'worldbooks:create',
  };
}

export function editWorldbookPage(worldbookId: string): WorldbookPage {
  return {
    name: 'editMain',
    key: `worldbook:${worldbookId}:edit`,
    worldbookId,
    sessionKey: worldbookSessionKey(worldbookId),
  };
}

export function worldbookEntryListPage(worldbookId: string, sessionKey: string): WorldbookPage {
  return {
    name: 'entryList',
    key: `worldbook:${worldbookId}:entries`,
    worldbookId,
    sessionKey,
  };
}

export function worldbookEntryCreatePage(worldbookId: string, sessionKey: string): WorldbookPage {
  return {
    name: 'entryCreate',
    key: `worldbook:${worldbookId}:entry:create`,
    worldbookId,
    sessionKey,
  };
}

export function worldbookEntryEditPage(
  worldbookId: string,
  entryId: string,
  sessionKey: string,
): WorldbookPage {
  return {
    name: 'entryEdit',
    key: `worldbook:${worldbookId}:entry:${entryId}`,
    worldbookId,
    entryId,
    sessionKey,
  };
}

export function importWorldbookPage(): WorldbookPage {
  return { name: 'import', key: 'worldbooks:import' };
}

export function worldbookSessionKey(worldbookId: string): string {
  return `worldbook:${worldbookId}`;
}
