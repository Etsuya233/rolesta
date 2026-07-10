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
export type WorldbookDocument =
  components["schemas"]["UpdateWorldbookDocumentRequestDto"];

export type WorldbookVisibility = WorldbookSummaryResponse["visibility"];
export type WorldbookInsertionPosition =
  WorldbookEntryResponse["insertionPosition"];
export type WorldbookEntryRole = WorldbookEntryResponse["insertionRole"];
export type WorldbookSelectiveLogic = WorldbookEntryResponse["selectiveLogic"];

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

export async function updateWorldbookDocument(
  id: string,
  document: WorldbookDocument,
): Promise<WorldbookDetailResponse> {
  const result = await requestApi(
    openApiClient.PUT("/worldbooks/{id}", {
      body: document,
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

function fetchAuthed(input: string, init: RequestInit = {}): Promise<Response> {
  const request = new Request(input, init);

  request.headers.set("Accept", "application/json");
  applyActiveLocaleHeader(request);
  applyAuthTokenHeader(request);

  return fetch(request);
}
