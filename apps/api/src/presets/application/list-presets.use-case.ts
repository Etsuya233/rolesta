import { clampPageIndex, clampPageSize, type PageResponse } from '@rolesta/shared';
import { UseCase } from '../../common/errors/index.js';
import type {
  PresetSortKey,
  PresetStore,
  SortDirection,
} from '../ports/preset-store.js';
import type { PresetSummary } from '../domain/preset.js';
import { translatePresetError } from './preset-error.mapper.js';

export interface ListPresetsCommand {
  viewerUserId: string;
  sort?: PresetSortKey;
  direction?: SortDirection;
  pageIndex?: number;
  pageSize?: number;
  q?: string;
}

export class ListPresetsUseCase {
  constructor(private readonly store: PresetStore) {}

  @UseCase(translatePresetError)
  execute(command: ListPresetsCommand): Promise<PageResponse<PresetSummary>> {
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
