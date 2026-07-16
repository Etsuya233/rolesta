export interface ChatAssetAvatar {
  resourceId: string;
  sources: Record<string, string>;
}

export interface CharacterAssetSelection {
  id: string;
  name: string;
  avatar: ChatAssetAvatar | null;
  comment?: string;
  tags?: string[];
  visibility?: 'private' | 'public';
  version?: string;
  usageCount?: number;
}

export interface PresetAssetSelection {
  id: string;
  name: string;
  visibility?: 'private' | 'public';
  entryCount?: number;
  promptItemCount?: number;
  tokenCount?: number;
  usageCount?: number;
}

export interface ModelProviderAssetSelection {
  id: string;
  name: string;
  providerKind: 'openai-compatible' | 'openai' | 'claude' | 'z-ai' | 'deepseek';
  defaultModelName: string;
}
