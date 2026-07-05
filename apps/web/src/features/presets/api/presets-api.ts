import type { ApiEnvelope } from "@rolesta/shared";
import {
  API_BASE_URL,
  ApiError,
  applyActiveLocaleHeader,
  applyAuthTokenHeader,
} from "../../../lib/api/client";

export type PresetEntryRole = "system" | "user" | "assistant";
export type PresetEntryPosition =
  | "system"
  | "chat"
  | "preHistory"
  | "postHistory"
  | "unknown";
export type PresetSortKey =
  | "createdAt"
  | "updatedAt"
  | "name"
  | "lastUsedAt"
  | "usageCount";
export type SortDirection = "asc" | "desc";

export interface PresetModelSettings {
  contextLength: number | null;
  maxResponseLength: number | null;
  stream: boolean;
  temperature: number | null;
  presencePenalty: number | null;
  frequencyPenalty: number | null;
  repetitionPenalty: number | null;
  topP: number | null;
  topK: number | null;
  minP: number | null;
  topA: number | null;
  seed: number | null;
  n: number | null;
  reasoningEffort: string;
  verbosity: string;
  showThoughts: boolean;
}

export interface PresetSummaryResponse {
  id: string;
  ownerUserId: string;
  name: string;
  entryCount: number;
  promptItemCount: number;
  tokenCount: number;
  createdAtMs: number;
  updatedAtMs: number;
  lastUsedAtMs: number | null;
  usageCount: number;
}

export interface PresetEntryResponse {
  id: string;
  presetId: string;
  identifier: string;
  name: string;
  role: PresetEntryRole;
  position: PresetEntryPosition;
  content: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface PresetPromptItemResponse {
  entryId: string;
  enabled: boolean;
  orderIndex: number;
}

export interface PresetDetailResponse extends PresetSummaryResponse {
  modelProviderId: string | null;
  modelSettings: PresetModelSettings;
  tokenizer: "cl100k_base";
  sourceFormat: "sillytavern_preset" | "rolesta";
  entries: PresetEntryResponse[];
  promptItems: PresetPromptItemResponse[];
}

export interface PresetPageResponse {
  items: PresetSummaryResponse[];
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ListPresetsQuery {
  sort?: PresetSortKey;
  direction?: SortDirection;
  pageIndex?: number;
  pageSize?: number;
  q?: string;
}

export interface PresetSaveValues {
  name?: string;
  modelSettings?: Partial<PresetModelSettings>;
}

export interface PresetCreateValues extends PresetSaveValues {
  name: string;
}

export interface PresetEntryCreateValues {
  name: string;
  role: PresetEntryRole;
  position: PresetEntryPosition;
  content: string;
}

export interface PresetEntryUpdateValues {
  name?: string;
  role?: PresetEntryRole;
  position?: PresetEntryPosition;
  content?: string;
}

export async function listPresets(query: ListPresetsQuery): Promise<PresetPageResponse> {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }

  return requestJson<PresetPageResponse>(`/presets?${search.toString()}`);
}

export function getPreset(id: string): Promise<PresetDetailResponse> {
  return requestJson<PresetDetailResponse>(`/presets/${id}`);
}

export function createPreset(values: PresetCreateValues): Promise<PresetDetailResponse> {
  return requestJson<PresetDetailResponse>("/presets", {
    body: JSON.stringify(values),
    method: "POST",
  });
}

export function updatePreset(
  id: string,
  values: PresetSaveValues,
): Promise<PresetDetailResponse> {
  return requestJson<PresetDetailResponse>(`/presets/${id}`, {
    body: JSON.stringify(values),
    method: "PATCH",
  });
}

export function deletePreset(id: string): Promise<{ ok: true }> {
  return requestJson<{ ok: true }>(`/presets/${id}`, { method: "DELETE" });
}

export function createPresetEntry(
  presetId: string,
  values: PresetEntryCreateValues,
): Promise<PresetDetailResponse> {
  return requestJson<PresetDetailResponse>(`/presets/${presetId}/entries`, {
    body: JSON.stringify(values),
    method: "POST",
  });
}

export function updatePresetEntry(
  presetId: string,
  entryId: string,
  values: PresetEntryUpdateValues,
): Promise<PresetDetailResponse> {
  return requestJson<PresetDetailResponse>(
    `/presets/${presetId}/entries/${entryId}`,
    {
      body: JSON.stringify(values),
      method: "PATCH",
    },
  );
}

export function deletePresetEntry(
  presetId: string,
  entryId: string,
): Promise<PresetDetailResponse> {
  return requestJson<PresetDetailResponse>(
    `/presets/${presetId}/entries/${entryId}`,
    { method: "DELETE" },
  );
}

export function updatePresetPromptItems(
  presetId: string,
  items: Array<{ entryId: string; enabled: boolean }>,
): Promise<PresetDetailResponse> {
  return requestJson<PresetDetailResponse>(`/presets/${presetId}/prompt-items`, {
    body: JSON.stringify({ items }),
    method: "PUT",
  });
}

export async function importPreset(file: File): Promise<PresetDetailResponse> {
  const formData = new FormData();
  formData.set("file", file);

  return requestJson<PresetDetailResponse>("/presets/import", {
    body: formData,
    method: "POST",
  });
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

async function requestJson<TData>(
  path: string,
  init: RequestInit = {},
): Promise<TData> {
  const request = new Request(`${API_BASE_URL}${path}`, init);

  if (!(init.body instanceof FormData)) {
    request.headers.set("Content-Type", "application/json");
  }
  request.headers.set("Accept", "application/json");
  applyActiveLocaleHeader(request);
  applyAuthTokenHeader(request);

  const response = await fetch(request);
  const envelope = (await response.json()) as ApiEnvelope<TData>;

  if (envelope.code !== "SUCCESS") {
    throw new ApiError(envelope.msg, {
      kind: "response",
      rawResponse: response,
    });
  }

  return envelope.data;
}

function fetchAuthed(input: string, init: RequestInit = {}): Promise<Response> {
  const request = new Request(input, init);

  request.headers.set("Accept", "application/json");
  applyActiveLocaleHeader(request);
  applyAuthTokenHeader(request);

  return fetch(request);
}
