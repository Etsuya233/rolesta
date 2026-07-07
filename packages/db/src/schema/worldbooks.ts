export interface WorldbooksTable {
  id: string;
  owner_user_id: string;
  visibility: "private" | "public";
  name: string;
  description: string;
  tags_json: string;
  scan_depth: number;
  token_budget: number;
  recursive_scan: number;
  source_format: "sillytavern_world_info" | "rolesta";
  source_snapshot_json: string;
  created_at_ms: number;
  updated_at_ms: number;
  last_used_at_ms: number | null;
  usage_count: number;
}

export interface WorldbookEntriesTable {
  id: string;
  worldbook_id: string;
  external_uid: number | null;
  enabled: number;
  name: string;
  add_memo: number;
  comment: string;
  content: string;
  primary_keys_json: string;
  secondary_keys_json: string;
  condition_logic: "andAny" | "notAll" | "notAny" | "andAll";
  selective: number;
  constant: number;
  vectorized: number;
  case_sensitive: "inherit" | "enabled" | "disabled";
  match_whole_words: "inherit" | "enabled" | "disabled";
  insertion_position:
    | "beforeCharacterDefinition"
    | "afterCharacterDefinition"
    | "beforeAuthorNote"
    | "afterAuthorNote"
    | "atDepth"
    | "beforeExampleMessages"
    | "afterExampleMessages"
    | "outlet"
    | "unknown";
  depth_role: "system" | "user" | "assistant";
  insertion_order: number;
  display_order: number;
  depth: number;
  use_probability: number;
  probability: number;
  scan_depth: number | null;
  recursive_scan: number;
  prevent_further_recursion: number;
  delay_until_recursion: number;
  recursion_delay_level: number | null;
  ignore_budget: number;
  entry_group: string;
  group_override: number;
  group_weight: number;
  use_group_scoring: "inherit" | "enabled" | "disabled";
  sticky: number | null;
  cooldown: number | null;
  delay: number | null;
  match_persona_description: number;
  match_character_description: number;
  match_character_personality: number;
  match_scenario: number;
  match_creator_notes: number;
  match_character_depth_prompt: number;
  automation_id: string;
  generation_triggers_json: string;
  outlet_name: string;
  character_filter_json: string;
  token_count: number;
  created_at_ms: number;
  updated_at_ms: number;
}
