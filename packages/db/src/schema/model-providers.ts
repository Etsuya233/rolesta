export interface ModelProviderConfigsTable {
  id: string;
  owner_user_id: string;
  name: string;
  provider_kind: 'openai-compatible' | 'openai' | 'claude' | 'z-ai' | 'deepseek';
  provider_source: 'custom' | 'official';
  base_url: string;
  default_model_name: string;
  credential_mode: 'manual' | 'vault';
  secret: string;
  api_key_id: string | null;
  created_at_ms: number;
  updated_at_ms: number;
  last_used_at_ms: number | null;
  usage_count: number;
}

export interface ApiKeysTable {
  id: string;
  owner_user_id: string;
  name: string;
  secret: string;
  created_at_ms: number;
  updated_at_ms: number;
}
