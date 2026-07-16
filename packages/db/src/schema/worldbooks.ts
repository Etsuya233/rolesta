export interface WorldbooksTable {
  id: string;
  owner_user_id: string;
  visibility: 'private' | 'public';
  name: string;
  description: string;
  tags_json: string;
  source_format: 'sillytavern_world_info' | 'rolesta';
  source_snapshot_json: string;
  created_at_ms: number;
  updated_at_ms: number;
  last_used_at_ms: number | null;
  usage_count: number;
}

export interface WorldbookEntriesTable {
  id: string;
  worldbook_id: string;
  enabled: number;
  name: string;
  comment: string;
  content: string;
  primary_keys_json: string;
  secondary_keys_json: string;
  selective: number;
  selective_logic: 'andAny' | 'notAll' | 'notAny' | 'andAll';
  constant: number;
  vectorized: number;
  ignore_budget: number;
  use_probability: number;
  case_sensitive: number;
  match_whole_words: number;
  match_persona_description: number;
  match_character_description: number;
  match_character_personality: number;
  match_character_depth_prompt: number;
  match_scenario: number;
  match_creator_notes: number;
  insertion_position:
    | 'beforeCharacterDefinition'
    | 'afterCharacterDefinition'
    | 'beforeAuthorsNote'
    | 'afterAuthorsNote'
    | 'atDepth'
    | 'beforeExampleMessages'
    | 'afterExampleMessages'
    | 'atAnchor'
    | 'unknown';
  insertion_order: number;
  display_index: number;
  depth: number;
  insertion_role: 'system' | 'user' | 'assistant';
  anchor_name: string;
  entry_scan_depth: number | null;
  exclude_recursion: number;
  prevent_recursion: number;
  delay_until_recursion: number;
  group_name: string;
  group_override: number;
  group_weight: number;
  use_group_scoring: number | null;
  sticky: number | null;
  cooldown: number | null;
  delay: number | null;
  character_filter_names_json: string;
  character_filter_tags_json: string;
  character_filter_exclude: number;
  triggers_json: string;
  automation_id: string;
  add_memo: number;
  probability: number;
  token_count: number;
  created_at_ms: number;
  updated_at_ms: number;
}

export interface WorldbookScanPreferencesTable {
  user_id: string;
  scan_depth: number;
  min_activations: number;
  min_activations_depth_max: number;
  budget_percent: number;
  budget_cap: number;
  recursive: number;
  case_sensitive: number;
  match_whole_words: number;
  use_group_scoring: number;
  max_recursion_steps: number;
  include_names: number;
  character_lore_insertion_strategy: 'evenly' | 'characterFirst' | 'globalFirst';
}
