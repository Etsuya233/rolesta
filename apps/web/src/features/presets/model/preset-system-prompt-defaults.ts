import type {
  PresetDocumentPromptItem,
  PresetEntryRole,
  PresetGenerationType,
  PresetPromptPlacement,
} from '../api/presets-api';
import { isSystemPromptItem } from './preset-editor-form';

type SystemPromptKey =
  'mainPrompt' | 'auxiliaryPrompt' | 'enhanceDefinitions' | 'postHistoryInstructions';

interface SystemPromptDefault {
  name: string;
  role: PresetEntryRole;
  content: string;
  placement: PresetPromptPlacement;
  generationTypes: PresetGenerationType[];
  allowCharacterOverride?: boolean;
  enabled: boolean;
}

const systemPromptDefaults: Record<SystemPromptKey, SystemPromptDefault> = {
  mainPrompt: {
    name: 'Main Prompt',
    role: 'system',
    content:
      "Write {{char}}'s next reply in a fictional chat between {{charIfNotGroup}} and {{user}}.",
    placement: { kind: 'relative' },
    generationTypes: [],
    allowCharacterOverride: true,
    enabled: true,
  },
  auxiliaryPrompt: {
    name: 'Auxiliary Prompt',
    role: 'system',
    content: '',
    placement: { kind: 'relative' },
    generationTypes: [],
    enabled: true,
  },
  enhanceDefinitions: {
    name: 'Enhance Definitions',
    role: 'system',
    content:
      "If you have more knowledge of {{char}}, add to the character's lore and personality to enhance them but keep the Character Sheet's definitions absolute.",
    placement: { kind: 'relative' },
    generationTypes: [],
    enabled: false,
  },
  postHistoryInstructions: {
    name: 'Post-History Instructions',
    role: 'system',
    content: '',
    placement: { kind: 'relative' },
    generationTypes: [],
    allowCharacterOverride: true,
    enabled: true,
  },
};

export function restoreSystemPromptDefault(
  item: PresetDocumentPromptItem,
): PresetDocumentPromptItem {
  if (!isSystemPromptItem(item)) {
    throw new Error('Only system prompts have restorable defaults.');
  }

  return {
    id: item.id,
    kind: item.kind,
    systemPrompt: item.systemPrompt,
    ...systemPromptDefaults[item.systemPrompt],
  };
}
