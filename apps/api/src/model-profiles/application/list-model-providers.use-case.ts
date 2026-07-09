import { UseCase } from '../../common/errors/index.js';
import { clampPageIndex, clampPageSize, type PageResponse } from '@rolesta/shared';
import type { ModelProviderSummary } from '../domain/model-provider-config.js';
import type {
  ModelProviderSortKey,
  ModelProviderStore,
  SortDirection,
} from '../ports/model-provider-store.js';
import { translateModelProviderError } from './model-provider-error.mapper.js';

export interface ListModelProvidersCommand {
  viewerUserId: string;
  sort?: ModelProviderSortKey;
  direction?: SortDirection;
  pageIndex?: number;
  pageSize?: number;
  q?: string;
}

export class ListModelProvidersUseCase {
  constructor(private readonly store: ModelProviderStore) {}

  @UseCase(translateModelProviderError)
  execute(command: ListModelProvidersCommand): Promise<PageResponse<ModelProviderSummary>> {
    return this.store.list({
      viewerUserId: command.viewerUserId,
      sort: command.sort ?? 'createdAt',
      direction: command.direction ?? 'desc',
      pageIndex: clampPageIndex(command.pageIndex ?? 0),
      pageSize: clampPageSize(command.pageSize ?? 20),
      q: command.q ?? '',
    });
  }
}
