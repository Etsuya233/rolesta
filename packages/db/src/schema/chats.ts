export interface ChatsTable {
  id: string;
  owner_user_id: string;
  title: string;
  chat_character_id: string | null;
  persona_character_id: string | null;
  preset_id: string | null;
  model_provider_id: string | null;
  created_at_ms: number;
  updated_at_ms: number;
}
