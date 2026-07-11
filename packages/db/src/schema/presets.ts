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
  position: 'system' | 'chat' | 'preHistory' | 'postHistory' | 'unknown';
  content: string;
  token_count: number;
  metadata_json: string;
  created_at_ms: number;
  updated_at_ms: number;
}

export interface PresetPromptItemsTable {
  preset_id: string;
  entry_id: string;
  enabled: number;
  order_index: number;
}
