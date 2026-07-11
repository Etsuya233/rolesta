import {
  API_BASE_URL,
  ApiError,
  applyActiveLocaleHeader,
  applyAuthTokenHeader,
  openApiClient,
  requestApi,
} from "../../../lib/api/client";
import type { components, operations } from "../../../lib/api/generated/schema";

export type PresetModelSettings =
  components["schemas"]["PresetModelSettingsResponseDto"];
export type PresetSummaryResponse =
  components["schemas"]["PresetSummaryResponseDto"];
export type PresetEntryResponse =
  components["schemas"]["PresetEntryResponseDto"];
export type PresetPromptItemResponse =
  components["schemas"]["PresetPromptItemResponseDto"];
export type PresetDetailResponse =
  components["schemas"]["PresetDetailResponseDto"];
export type PresetPageResponse = components["schemas"]["PresetPageResponseDto"];
export type PresetDocument =
  components["schemas"]["UpdatePresetDocumentRequestDto"];
export type PresetCreateValues =
  components["schemas"]["CreatePresetRequestDto"];

export type PresetEntryRole = PresetEntryResponse["role"];
export type PresetEntryPosition = PresetEntryResponse["position"];
export type PresetVisibility = PresetSummaryResponse["visibility"];

export type ListPresetsQuery = NonNullable<
  operations["PresetsController_list"]["parameters"]["query"]
>;
export type PresetSortKey = NonNullable<ListPresetsQuery["sort"]>;
export type PresetListScope = NonNullable<ListPresetsQuery["scope"]>;
export type SortDirection = NonNullable<ListPresetsQuery["direction"]>;

export async function listPresets(
  query: ListPresetsQuery,
): Promise<PresetPageResponse> {
  const result = await requestApi(
    openApiClient.GET("/presets", { params: { query } }),
  );
  return result.data;
}

export async function getPreset(id: string): Promise<PresetDetailResponse> {
  const result = await requestApi(
    openApiClient.GET("/presets/{id}", { params: { path: { id } } }),
  );
  return result.data;
}

export async function createPreset(
  values: PresetCreateValues,
): Promise<PresetDetailResponse> {
  const result = await requestApi(
    openApiClient.POST("/presets", { body: values }),
  );
  return result.data;
}

export async function updatePresetDocument(
  id: string,
  document: PresetDocument,
): Promise<PresetDetailResponse> {
  const result = await requestApi(
    openApiClient.PUT("/presets/{id}", {
      body: document,
      params: { path: { id } },
    }),
  );
  return result.data;
}

export async function deletePreset(id: string): Promise<{ ok?: boolean }> {
  const result = await requestApi(
    openApiClient.DELETE("/presets/{id}", { params: { path: { id } } }),
  );
  return result.data;
}

export async function importPreset(file: File): Promise<PresetDetailResponse> {
  const formData = new FormData();
  formData.set("file", file);

  const result = await requestApi(
    openApiClient.POST("/presets/import", { body: formData as never }),
  );
  return result.data;
}

export async function exportPreset(id: string): Promise<Blob> {
  const response = await fetchAuthed(
    `${API_BASE_URL}/presets/${id}/export/sillytavern`,
  );

  if (!response.ok) {
    throw new ApiError("Preset export failed", {
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
