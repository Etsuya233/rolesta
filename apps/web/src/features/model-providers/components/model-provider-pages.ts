export type ModelProviderPage =
  | { name: "list"; key: "model-providers:list" }
  | { name: "api-keys"; key: "model-providers:api-keys" }
  | { name: "create"; key: "model-providers:create"; sessionKey: string }
  | {
      name: "edit";
      key: string;
      configId: string;
      sessionKey: string;
    };

export const modelProviderListPage: ModelProviderPage = {
  name: "list",
  key: "model-providers:list",
};

export const modelProviderApiKeysPage: ModelProviderPage = {
  name: "api-keys",
  key: "model-providers:api-keys",
};

export function createModelProviderPage(): ModelProviderPage {
  return {
    name: "create",
    key: "model-providers:create",
    sessionKey: "model-providers:create",
  };
}

export function editModelProviderPage(configId: string): ModelProviderPage {
  return {
    name: "edit",
    key: `model-providers:edit:${configId}`,
    configId,
    sessionKey: modelProviderSessionKey(configId),
  };
}

export function modelProviderSessionKey(configId: string): string {
  return `model-providers:edit:${configId}`;
}
