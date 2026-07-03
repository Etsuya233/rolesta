import type { ApiEnvelope } from '@rolesta/shared';
import {
  API_BASE_URL,
  ApiError,
  applyActiveLocaleHeader,
  applyAuthTokenHeader,
  requestApi,
} from '../../../lib/api/client';
import type { components } from '../../../lib/api/generated/schema';

export type CharacterSummaryResponse = components['schemas']['CharacterSummaryResponseDto'];
export type CharacterPageResponse = components['schemas']['CharacterPageResponseDto'];
export type CharacterDetailResponse = components['schemas']['CharacterDetailResponseDto'];

export type CharacterListScope = 'all' | 'mine' | 'public';
export type CharacterSortKey = 'createdAt' | 'updatedAt' | 'name' | 'lastUsedAt' | 'usageCount';
export type SortDirection = 'asc' | 'desc';

export interface ListCharactersQuery {
  scope?: CharacterListScope;
  sort?: CharacterSortKey;
  direction?: SortDirection;
  pageIndex?: number;
  pageSize?: number;
  q?: string;
}

export interface CharacterFormValues {
  visibility?: 'private' | 'public';
  name?: string;
  nickname?: string | null;
  comment?: string;
  tags?: string[];
  version?: string;
  creator?: string | null;
  description?: string;
  personality?: string;
  scenario?: string;
  firstMessage?: string;
  alternateGreetings?: string[];
  groupOnlyGreetings?: string[];
  messageExample?: string;
  creatorNotes?: string;
  creatorNotesMultilingual?: Record<string, string>;
  systemPrompt?: string;
  postHistoryInstructions?: string;
  characterBook?: Record<string, unknown> | null;
  assets?: unknown[];
  source?: string[];
  metadata?: Record<string, unknown>;
}

export async function listCharacters(query: ListCharactersQuery): Promise<CharacterPageResponse> {
  const result = await requestApi(fetchEnvelope<CharacterPageResponse>(characterListPath(query)));
  return result.data;
}

export async function getCharacter(id: string): Promise<CharacterDetailResponse> {
  const result = await requestApi(fetchEnvelope<CharacterDetailResponse>(`/characters/${id}`));
  return result.data;
}

export async function createCharacter(values: CharacterFormValues): Promise<CharacterDetailResponse> {
  const result = await requestApi(fetchJsonEnvelope<CharacterDetailResponse>('/characters', 'POST', values));
  return result.data;
}

export async function updateCharacter(
  id: string,
  values: CharacterFormValues,
): Promise<CharacterDetailResponse> {
  const result = await requestApi(
    fetchJsonEnvelope<CharacterDetailResponse>(`/characters/${id}`, 'PATCH', values),
  );
  return result.data;
}

export async function deleteCharacter(id: string): Promise<{ ok?: boolean }> {
  const result = await requestApi(fetchEnvelope<{ ok?: boolean }>(`/characters/${id}`, { method: 'DELETE' }));
  return result.data;
}

export async function importCharacterCard(file: File): Promise<CharacterDetailResponse> {
  const formData = new FormData();
  formData.set('file', file);

  const result = await requestApi(
    fetchEnvelope('/characters/import', {
      method: 'POST',
      body: formData,
    }),
  );

  return result.data;
}

export async function exportCharacterCard(id: string, version: 'v2' | 'v3'): Promise<Blob> {
  const response = await fetchAuthed(
    `${API_BASE_URL}/characters/${id}/export/sillytavern?version=${version}`,
  );

  if (!response.ok) {
    throw new ApiError('Character export failed', { kind: 'response', rawResponse: response });
  }

  return response.blob();
}

function characterListPath(query: ListCharactersQuery): string {
  const params = new URLSearchParams();

  if (query.scope) {
    params.set('scope', query.scope);
  }
  if (query.sort) {
    params.set('sort', query.sort);
  }
  if (query.direction) {
    params.set('direction', query.direction);
  }
  if (query.pageIndex !== undefined) {
    params.set('pageIndex', String(query.pageIndex));
  }
  if (query.pageSize !== undefined) {
    params.set('pageSize', String(query.pageSize));
  }
  if (query.q) {
    params.set('q', query.q);
  }

  const queryString = params.toString();
  return queryString ? `/characters?${queryString}` : '/characters';
}

function fetchJsonEnvelope<TData>(
  path: string,
  method: 'POST' | 'PATCH',
  body: CharacterFormValues,
): Promise<{
  data?: ApiEnvelope<TData>;
  error?: ApiEnvelope<unknown>;
  response: Response;
}> {
  return fetchEnvelope<TData>(path, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

async function fetchEnvelope<TData>(path: string, init: RequestInit = {}): Promise<{
  data?: ApiEnvelope<TData>;
  error?: ApiEnvelope<unknown>;
  response: Response;
}> {
  const response = await fetchAuthed(`${API_BASE_URL}${path}`, init);
  const envelope = (await response.json()) as ApiEnvelope<TData>;

  return response.ok ? { data: envelope, response } : { error: envelope, response };
}

function fetchAuthed(input: string, init: RequestInit = {}): Promise<Response> {
  const request = new Request(input, init);

  request.headers.set('Accept', 'application/json');
  applyActiveLocaleHeader(request);
  applyAuthTokenHeader(request);

  return fetch(request);
}
