import {
  API_BASE_URL,
  ApiError,
  applyActiveLocaleHeader,
  applyAuthTokenHeader,
  openApiClient,
  requestApi,
} from '../../../lib/api/client';
import type { components, operations } from '../../../lib/api/generated/schema';

export type CharacterSummaryResponse = components['schemas']['CharacterSummaryResponseDto'];
export type CharacterDetailResponse = components['schemas']['CharacterDetailResponseDto'];
export type CharacterCreateValues = components['schemas']['CreateCharacterRequestDto'];
export type CharacterFormValues = components['schemas']['UpdateCharacterRequestDto'];

export type ListCharactersQuery = NonNullable<
  operations['CharactersController_list']['parameters']['query']
>;

export type CharacterListScope = NonNullable<ListCharactersQuery['scope']>;
export type CharacterSortKey = NonNullable<ListCharactersQuery['sort']>;
export type SortDirection = NonNullable<ListCharactersQuery['direction']>;

export async function listCharacters(query: ListCharactersQuery) {
  const result = await requestApi(openApiClient.GET('/characters', { params: { query } }));
  return result.data;
}

export async function getCharacter(id: string) {
  const result = await requestApi(
    openApiClient.GET('/characters/{id}', { params: { path: { id } } }),
  );
  return result.data;
}

export async function createCharacter(values: CharacterCreateValues) {
  const result = await requestApi(openApiClient.POST('/characters', { body: values }));
  return result.data;
}

export async function updateCharacter(
  id: string,
  values: CharacterFormValues,
) {
  const result = await requestApi(
    openApiClient.PATCH('/characters/{id}', { body: values, params: { path: { id } } }),
  );
  return result.data;
}

export async function deleteCharacter(id: string) {
  const result = await requestApi(
    openApiClient.DELETE('/characters/{id}', { params: { path: { id } } }),
  );
  return result.data;
}

export async function importCharacterCard(file: File) {
  const formData = new FormData();
  formData.set('file', file);

  const result = await requestApi(
    openApiClient.POST('/characters/import', { body: formData as never }),
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

function fetchAuthed(input: string, init: RequestInit = {}): Promise<Response> {
  const request = new Request(input, init);

  request.headers.set('Accept', 'application/json');
  applyActiveLocaleHeader(request);
  applyAuthTokenHeader(request);

  return fetch(request);
}
