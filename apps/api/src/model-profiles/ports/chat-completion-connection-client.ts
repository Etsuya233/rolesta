import type { ModelProviderKind } from '../domain/model-provider-catalog.js';

export const CHAT_COMPLETION_CONNECTION_CLIENT = Symbol('ChatCompletionConnectionClient');

export interface ListChatCompletionModelsRequest {
  providerKind: ModelProviderKind;
  baseUrl: string;
  apiKeySecret: string | undefined;
}

export interface TestChatCompletionRequest {
  providerKind: ModelProviderKind;
  baseUrl: string;
  defaultModelName: string;
  apiKeySecret: string | undefined;
}

export interface TestChatCompletionResult {
  modelName: string;
  remoteResponseId: string | null;
}

export interface ChatCompletionConnectionClient {
  listModels(request: ListChatCompletionModelsRequest): Promise<string[]>;
  testChatCompletion(request: TestChatCompletionRequest): Promise<TestChatCompletionResult>;
}
