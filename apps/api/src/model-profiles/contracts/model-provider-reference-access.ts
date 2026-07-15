export const MODEL_PROVIDER_REFERENCE_ACCESS = Symbol('ModelProviderReferenceAccess');

export interface ModelProviderReferenceAccess {
  acquireOwned(modelProviderId: string, ownerUserId: string): Promise<boolean>;
}
