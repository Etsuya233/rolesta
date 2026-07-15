import { openApiClient, requestApi } from '../../../lib/api/client';
import type { components } from '../../../lib/api/generated/schema';

export type AssetDefaults = components['schemas']['AssetDefaultsResponseDto'];
export type AssetDefaultsPatch = components['schemas']['UpdateAssetDefaultsRequestDto'];

export async function getAssetDefaults(): Promise<AssetDefaults> {
  const result = await requestApi(openApiClient.GET('/chat-preferences/assets'));
  return result.data;
}

export async function updateAssetDefaults(patch: AssetDefaultsPatch): Promise<AssetDefaults> {
  const result = await requestApi(openApiClient.PATCH('/chat-preferences/assets', { body: patch }));
  return result.data;
}
