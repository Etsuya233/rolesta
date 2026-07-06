export type ModelProviderPage =
  | { name: "list"; key: "model-providers:list" }
  | { name: "create"; key: "model-providers:create"; sessionKey: string }
  | {
      name: "edit";
      key: string;
      configId: string;
      sessionKey: string;
    }
  | {
      name: "apiKeys";
      key: string;
      configId: string;
      sessionKey: string;
    };

export const modelProviderListPage: ModelProviderPage = {
  name: "list",
  key: "model-providers:list",
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

export function modelProviderApiKeysPage(
  configId: string,
  sessionKey: string,
): ModelProviderPage {
  return {
    name: "apiKeys",
    key: `model-providers:api-keys:${configId}`,
    configId,
    sessionKey,
  };
}

export function modelProviderSessionKey(configId: string): string {
  return `model-providers:edit:${configId}`;
}
