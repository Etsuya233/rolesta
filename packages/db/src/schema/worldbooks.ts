export interface WorldbooksTable {
  id: string;
  owner_user_id: string;
  visibility: 'private' | 'public';
  name: string;
  description: string;
  tags_json: string;
  scan_depth: number;
  token_budget: number;
  recursive_scan: number;
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
  case_sensitive: number;
  match_whole_words: number;
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
  depth: number;
  insertion_role: 'system' | 'user' | 'assistant';
  anchor_name: string;
  entry_scan_depth: number | null;
  exclude_recursion: number;
  prevent_recursion: number;
  delay_until_recursion: number;
  probability: number;
  token_count: number;
  created_at_ms: number;
  updated_at_ms: number;
}
