export type PresetPage =
  | { name: 'list'; key: 'presets:list' }
  | { name: 'create'; key: 'presets:create'; sessionKey: string }
  | { name: 'editMain'; key: string; presetId: string; sessionKey: string }
  | { name: 'promptList'; key: string; presetId: string; sessionKey: string }
  | { name: 'entryCreate'; key: string; presetId: string; sessionKey: string }
  | {
      name: 'entryEdit';
      key: string;
      presetId: string;
      entryId: string;
      sessionKey: string;
    }
  | { name: 'import'; key: 'presets:import' };

export const presetListPage: PresetPage = {
  name: 'list',
  key: 'presets:list',
};

export function createPresetPage(): PresetPage {
  return {
    name: 'create',
    key: 'presets:create',
    sessionKey: 'presets:create',
  };
}

export function editPresetPage(presetId: string): PresetPage {
  return {
    name: 'editMain',
    key: `preset:${presetId}:edit`,
    presetId,
    sessionKey: presetSessionKey(presetId),
  };
}

export function presetPromptListPage(presetId: string, sessionKey: string): PresetPage {
  return {
    name: 'promptList',
    key: `preset:${presetId}:prompts`,
    presetId,
    sessionKey,
  };
}

export function presetEntryCreatePage(presetId: string, sessionKey: string): PresetPage {
  return {
    name: 'entryCreate',
    key: `preset:${presetId}:entry:create`,
    presetId,
    sessionKey,
  };
}

export function presetEntryEditPage(
  presetId: string,
  entryId: string,
  sessionKey: string,
): PresetPage {
  return {
    name: 'entryEdit',
    key: `preset:${presetId}:entry:${entryId}`,
    presetId,
    entryId,
    sessionKey,
  };
}

export function importPresetPage(): PresetPage {
  return { name: 'import', key: 'presets:import' };
}

export function presetSessionKey(presetId: string): string {
  return `preset:${presetId}`;
}
