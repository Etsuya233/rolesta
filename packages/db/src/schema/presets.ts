export interface PresetsTable {
  id: string;
  owner_user_id: string;
  visibility: 'private' | 'public';
  name: string;
  model_provider_id: string | null;
  model_settings_json: string;
  tokenizer: 'cl100k_base';
  source_format: 'sillytavern_preset' | 'rolesta';
  source_snapshot_json: string;
  created_at_ms: number;
  updated_at_ms: number;
  last_used_at_ms: number | null;
  usage_count: number;
}

export interface PresetEntriesTable {
  id: string;
  preset_id: string;
  identifier: string;
  name: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  placement_kind: 'relative' | 'inChat';
  in_chat_depth: number | null;
  in_chat_order: number | null;
  generation_types_json: string;
  token_count: number;
  metadata_json: string;
  created_at_ms: number;
  updated_at_ms: number;
}

export interface PresetPromptItemsTable {
  id: string;
  preset_id: string;
  kind: 'slot' | 'systemPrompt' | 'customPrompt';
  slot_key:
    | 'worldInfoBefore'
    | 'personaDescription'
    | 'characterDescription'
    | 'characterPersonality'
    | 'scenario'
    | 'worldInfoAfter'
    | 'dialogueExamples'
    | 'chatHistory'
    | null;
  system_prompt_key:
    'mainPrompt' | 'auxiliaryPrompt' | 'enhanceDefinitions' | 'postHistoryInstructions' | null;
  entry_id: string | null;
  name: string | null;
  role: 'system' | 'user' | 'assistant' | null;
  content: string | null;
  placement_kind: 'relative' | 'inChat' | null;
  in_chat_depth: number | null;
  in_chat_order: number | null;
  generation_types_json: string;
  allow_character_override: number | null;
  token_count: number | null;
  enabled: number;
  order_index: number;
}
