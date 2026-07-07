import {
  API_BASE_URL,
  ApiError,
  applyActiveLocaleHeader,
  applyAuthTokenHeader,
  openApiClient,
  requestApi,
} from "../../../lib/api/client";
import type { components, operations } from "../../../lib/api/generated/schema";

export type WorldbookSummaryResponse =
  components["schemas"]["WorldbookSummaryResponseDto"];
export type WorldbookDetailResponse =
  components["schemas"]["WorldbookDetailResponseDto"];
export type WorldbookEntryResponse =
  components["schemas"]["WorldbookEntryResponseDto"];
export type WorldbookPageResponse =
  components["schemas"]["WorldbookPageResponseDto"];
export type WorldbookCreateValues =
  components["schemas"]["CreateWorldbookRequestDto"];
export type WorldbookSaveValues =
  components["schemas"]["UpdateWorldbookRequestDto"];
export type WorldbookEntryCreateValues =
  components["schemas"]["CreateWorldbookEntryRequestDto"];
export type WorldbookEntryUpdateValues =
  components["schemas"]["UpdateWorldbookEntryRequestDto"];

export type WorldbookVisibility = WorldbookSummaryResponse["visibility"];
export type WorldbookInsertionPosition =
  WorldbookEntryResponse["insertionPosition"];

export type ListWorldbooksQuery = NonNullable<
  operations["WorldbooksController_list"]["parameters"]["query"]
>;
export type WorldbookSortKey = NonNullable<ListWorldbooksQuery["sort"]>;
export type SortDirection = NonNullable<ListWorldbooksQuery["direction"]>;

export async function listWorldbooks(
  query: ListWorldbooksQuery,
): Promise<WorldbookPageResponse> {
  const result = await requestApi(
    openApiClient.GET("/worldbooks", { params: { query } }),
  );
  return result.data;
}

export async function getWorldbook(
  id: string,
): Promise<WorldbookDetailResponse> {
  const result = await requestApi(
    openApiClient.GET("/worldbooks/{id}", { params: { path: { id } } }),
  );
  return result.data;
}

export async function createWorldbook(
  values: WorldbookCreateValues,
): Promise<WorldbookDetailResponse> {
  const result = await requestApi(
    openApiClient.POST("/worldbooks", { body: values }),
  );
  return result.data;
}

export async function updateWorldbook(
  id: string,
  values: WorldbookSaveValues,
): Promise<WorldbookDetailResponse> {
  const result = await requestApi(
    openApiClient.PATCH("/worldbooks/{id}", {
      body: values,
      params: { path: { id } },
    }),
  );
  return result.data;
}

export async function deleteWorldbook(id: string): Promise<{ ok?: boolean }> {
  const result = await requestApi(
    openApiClient.DELETE("/worldbooks/{id}", { params: { path: { id } } }),
  );
  return result.data;
}

export async function importWorldbook(
  file: File,
): Promise<WorldbookDetailResponse> {
  const formData = new FormData();
  formData.set("file", file);

  const result = await requestApi(
    openApiClient.POST("/worldbooks/import", { body: formData as never }),
  );
  return result.data;
}

export async function exportWorldbook(id: string): Promise<Blob> {
  const response = await fetchAuthed(
    `${API_BASE_URL}/worldbooks/${id}/export/sillytavern`,
  );

  if (!response.ok) {
    throw new ApiError("Worldbook export failed", {
      kind: "response",
      rawResponse: response,
    });
  }

  return response.blob();
}

export async function createWorldbookEntry(
  worldbookId: string,
  values: WorldbookEntryCreateValues,
): Promise<WorldbookDetailResponse> {
  const result = await requestApi(
    openApiClient.POST("/worldbooks/{id}/entries", {
      body: values,
      params: { path: { id: worldbookId } },
    }),
  );
  return result.data;
}

export async function updateWorldbookEntry(
  worldbookId: string,
  entryId: string,
  values: WorldbookEntryUpdateValues,
): Promise<WorldbookDetailResponse> {
  const result = await requestApi(
    openApiClient.PATCH("/worldbooks/{id}/entries/{entryId}", {
      body: values,
      params: { path: { id: worldbookId, entryId } },
    }),
  );
  return result.data;
}

export async function deleteWorldbookEntry(
  worldbookId: string,
  entryId: string,
): Promise<WorldbookDetailResponse> {
  const result = await requestApi(
    openApiClient.DELETE("/worldbooks/{id}/entries/{entryId}", {
      params: { path: { id: worldbookId, entryId } },
    }),
  );
  return result.data;
}

export async function updateWorldbookEntryOrder(
  worldbookId: string,
  entries: Array<{ entryId: string; enabled: boolean }>,
): Promise<WorldbookDetailResponse> {
  const result = await requestApi(
    openApiClient.PUT("/worldbooks/{id}/entries/order", {
      body: { entries },
      params: { path: { id: worldbookId } },
    }),
  );
  return result.data;
}

function fetchAuthed(input: string, init: RequestInit = {}): Promise<Response> {
  const request = new Request(input, init);

  request.headers.set("Accept", "application/json");
  applyActiveLocaleHeader(request);
  applyAuthTokenHeader(request);

  return fetch(request);
}
