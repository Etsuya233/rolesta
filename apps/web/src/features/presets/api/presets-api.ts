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
export type PresetSaveValues = components["schemas"]["UpdatePresetRequestDto"];
export type PresetCreateValues = components["schemas"]["CreatePresetRequestDto"];
export type PresetEntryCreateValues =
  components["schemas"]["CreatePresetEntryRequestDto"];
export type PresetEntryUpdateValues =
  components["schemas"]["UpdatePresetEntryRequestDto"];

export type PresetEntryRole = PresetEntryResponse["role"];
export type PresetEntryPosition = PresetEntryResponse["position"];

export type ListPresetsQuery = NonNullable<
  operations["PresetsController_list"]["parameters"]["query"]
>;
export type PresetSortKey = NonNullable<ListPresetsQuery["sort"]>;
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
  const result = await requestApi(openApiClient.POST("/presets", { body: values }));
  return result.data;
}

export async function updatePreset(
  id: string,
  values: PresetSaveValues,
): Promise<PresetDetailResponse> {
  const result = await requestApi(
    openApiClient.PATCH("/presets/{id}", {
      body: values,
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

export async function createPresetEntry(
  presetId: string,
  values: PresetEntryCreateValues,
): Promise<PresetDetailResponse> {
  const result = await requestApi(
    openApiClient.POST("/presets/{id}/entries", {
      body: values,
      params: { path: { id: presetId } },
    }),
  );
  return result.data;
}

export async function updatePresetEntry(
  presetId: string,
  entryId: string,
  values: PresetEntryUpdateValues,
): Promise<PresetDetailResponse> {
  const result = await requestApi(
    openApiClient.PATCH("/presets/{id}/entries/{entryId}", {
      body: values,
      params: { path: { id: presetId, entryId } },
    }),
  );
  return result.data;
}

export async function deletePresetEntry(
  presetId: string,
  entryId: string,
): Promise<PresetDetailResponse> {
  const result = await requestApi(
    openApiClient.DELETE("/presets/{id}/entries/{entryId}", {
      params: { path: { id: presetId, entryId } },
    }),
  );
  return result.data;
}

export async function updatePresetPromptItems(
  presetId: string,
  items: Array<{ entryId: string; enabled: boolean }>,
): Promise<PresetDetailResponse> {
  const result = await requestApi(
    openApiClient.PUT("/presets/{id}/prompt-items", {
      body: { items },
      params: { path: { id: presetId } },
    }),
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
  const response = await fetchAuthed(`${API_BASE_URL}/presets/${id}/export/sillytavern`);

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
