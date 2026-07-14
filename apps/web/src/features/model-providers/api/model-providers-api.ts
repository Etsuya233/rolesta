import { openApiClient, requestApi } from "../../../lib/api/client";
import type { components, operations } from "../../../lib/api/generated/schema";

export type ModelProviderCatalogItem =
  components["schemas"]["ModelProviderCatalogItemResponseDto"];
export type ModelProviderCatalogResponse =
  components["schemas"]["ModelProviderCatalogResponseDto"];
export type ModelProviderSummaryResponse =
  components["schemas"]["ModelProviderSummaryResponseDto"];
export type ModelProviderDetailResponse =
  components["schemas"]["ModelProviderDetailResponseDto"];
export type ModelProviderApiKeyResponse =
  components["schemas"]["ModelProviderApiKeyResponseDto"];
export type ApiKeyListResponse = components["schemas"]["ApiKeyListResponseDto"];
export type DeleteApiKeyResponse =
  components["schemas"]["DeleteApiKeyResponseDto"];
export type ModelProviderPageResponse =
  components["schemas"]["ModelProviderPageResponseDto"];
export type ModelProviderSaveValues =
  components["schemas"]["UpdateModelProviderRequestDto"];
export type ModelProviderCreateValues =
  components["schemas"]["CreateModelProviderRequestDto"];
export type ModelProviderApiKeyCreateValues =
  components["schemas"]["CreateModelProviderApiKeyRequestDto"];
export type ModelProviderApiKeySaveValues =
  components["schemas"]["SaveModelProviderApiKeyRequestDto"];
export type ModelProviderConnectionPreviewValues =
  components["schemas"]["ModelProviderConnectionPreviewRequestDto"];
export type TestModelProviderConnectionValues =
  components["schemas"]["TestModelProviderConnectionRequestDto"];
export type ModelProviderModelListResponse =
  components["schemas"]["ModelProviderModelListResponseDto"];
export type TestModelProviderConnectionResponse =
  components["schemas"]["TestModelProviderConnectionResponseDto"];

export type ModelProviderKind = ModelProviderCreateValues["providerKind"];
export type ListModelProvidersQuery = NonNullable<
  operations["ModelProvidersController_list"]["parameters"]["query"]
>;
export type ModelProviderSortKey = NonNullable<ListModelProvidersQuery["sort"]>;
export type SortDirection = NonNullable<ListModelProvidersQuery["direction"]>;

export async function getModelProviderCatalog(): Promise<ModelProviderCatalogResponse> {
  const result = await requestApi(
    openApiClient.GET("/model-providers/catalog"),
  );
  return result.data;
}

export async function listModelProviders(
  query: ListModelProvidersQuery,
): Promise<ModelProviderPageResponse> {
  const result = await requestApi(
    openApiClient.GET("/model-providers", { params: { query } }),
  );
  return result.data;
}

export async function listAllModelProviders(): Promise<
  ModelProviderSummaryResponse[]
> {
  const firstPage = await listModelProviders({
    q: "",
    sort: "name",
    direction: "asc",
    pageIndex: 0,
    pageSize: 100,
  });
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
      listModelProviders({
        q: "",
        sort: "name",
        direction: "asc",
        pageIndex: index + 1,
        pageSize: 100,
      }),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((page) => page.items);
}

export async function getModelProvider(
  id: string,
): Promise<ModelProviderDetailResponse> {
  const result = await requestApi(
    openApiClient.GET("/model-providers/{id}", { params: { path: { id } } }),
  );
  return result.data;
}

export async function createModelProvider(
  values: ModelProviderCreateValues,
): Promise<ModelProviderDetailResponse> {
  const result = await requestApi(
    openApiClient.POST("/model-providers", { body: values }),
  );
  return result.data;
}

export async function updateModelProvider(
  id: string,
  values: ModelProviderSaveValues,
): Promise<ModelProviderDetailResponse> {
  const result = await requestApi(
    openApiClient.PATCH("/model-providers/{id}", {
      body: values,
      params: { path: { id } },
    }),
  );
  return result.data;
}

export async function deleteModelProvider(
  id: string,
): Promise<{ ok?: boolean }> {
  const result = await requestApi(
    openApiClient.DELETE("/model-providers/{id}", { params: { path: { id } } }),
  );
  return result.data;
}

export async function listApiKeys(): Promise<ApiKeyListResponse> {
  const result = await requestApi(openApiClient.GET("/api-keys"));
  return result.data;
}

export async function createModelProviderApiKey(
  values: ModelProviderApiKeyCreateValues,
): Promise<ModelProviderApiKeyResponse> {
  const result = await requestApi(
    openApiClient.POST("/api-keys", {
      body: values,
    }),
  );
  return result.data;
}

export async function updateModelProviderApiKey(
  apiKeyId: string,
  values: ModelProviderApiKeySaveValues,
): Promise<ModelProviderApiKeyResponse> {
  const result = await requestApi(
    openApiClient.PATCH("/api-keys/{id}", {
      body: values,
      params: { path: { id: apiKeyId } },
    }),
  );
  return result.data;
}

export async function getApiKeyReferenceCount(
  apiKeyId: string,
): Promise<DeleteApiKeyResponse> {
  const result = await requestApi(
    openApiClient.GET("/api-keys/{id}/references", {
      params: { path: { id: apiKeyId } },
    }),
  );
  return result.data;
}

export async function deleteModelProviderApiKey(
  apiKeyId: string,
): Promise<DeleteApiKeyResponse> {
  const result = await requestApi(
    openApiClient.DELETE("/api-keys/{id}", {
      params: { path: { id: apiKeyId } },
    }),
  );
  return result.data;
}

export async function previewModelProviderModels(
  values: ModelProviderConnectionPreviewValues,
): Promise<ModelProviderModelListResponse> {
  const result = await requestApi(
    openApiClient.POST("/model-providers/models/preview", { body: values }),
  );
  return result.data;
}

export async function previewTestModelProviderConnection(
  values: TestModelProviderConnectionValues,
): Promise<TestModelProviderConnectionResponse> {
  const result = await requestApi(
    openApiClient.POST("/model-providers/test-connection/preview", {
      body: values,
    }),
  );
  return result.data;
}

export async function listSavedModelProviderModels(
  configId: string,
): Promise<ModelProviderModelListResponse> {
  const result = await requestApi(
    openApiClient.POST("/model-providers/{id}/models", {
      params: { path: { id: configId } },
    }),
  );
  return result.data;
}

export async function testSavedModelProviderConnection(
  configId: string,
): Promise<TestModelProviderConnectionResponse> {
  const result = await requestApi(
    openApiClient.POST("/model-providers/{id}/test-connection", {
      params: { path: { id: configId } },
    }),
  );
  return result.data;
}
