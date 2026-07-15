import { ChevronFirst, ChevronLast } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../../components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { cn } from '../../../lib/utils';

export interface PageControlsProps {
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  pageSizeOptions?: number[];
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function PageControls({
  pageIndex,
  pageSize,
  totalPages,
  pageSizeOptions = [10, 20, 50, 100],
  onPageIndexChange,
  onPageSizeChange,
}: PageControlsProps) {
  const { t } = useTranslation();
  const lastPageIndex = Math.max(totalPages - 1, 0);
  const canGoPrevious = pageIndex > 0;
  const canGoNext = pageIndex < lastPageIndex;

  return (
    <div className="flex items-center justify-between gap-3">
      <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
        <SelectTrigger aria-label={t('assets.pagination.pageSizeLabel')} className="w-18">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Pagination
        aria-label={t('assets.pagination.navigationLabel')}
        className="mx-0 w-auto justify-end"
      >
        <PaginationContent>
          <PaginationItem>
            <CompactPageLink
              disabled={!canGoPrevious}
              label={t('assets.pagination.firstPage')}
              onClick={() => onPageIndexChange(0)}
            >
              <ChevronFirst aria-hidden="true" />
            </CompactPageLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious
              ariaLabel={t('assets.pagination.previousPage')}
              aria-disabled={!canGoPrevious}
              className={cn(!canGoPrevious && 'pointer-events-none opacity-40')}
              href="#"
              tabIndex={canGoPrevious ? undefined : -1}
              text={t('assets.pagination.previousPage')}
              onClick={(event) => {
                event.preventDefault();
                if (canGoPrevious) {
                  onPageIndexChange(Math.max(pageIndex - 1, 0));
                }
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="flex h-8 min-w-12 items-center justify-center text-xs text-muted-foreground">
              {pageIndex + 1}/{Math.max(totalPages, 1)}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              ariaLabel={t('assets.pagination.nextPage')}
              aria-disabled={!canGoNext}
              className={cn(!canGoNext && 'pointer-events-none opacity-40')}
              href="#"
              tabIndex={canGoNext ? undefined : -1}
              text={t('assets.pagination.nextPage')}
              onClick={(event) => {
                event.preventDefault();
                if (canGoNext) {
                  onPageIndexChange(Math.min(pageIndex + 1, lastPageIndex));
                }
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <CompactPageLink
              disabled={!canGoNext}
              label={t('assets.pagination.lastPage')}
              onClick={() => onPageIndexChange(lastPageIndex)}
            >
              <ChevronLast aria-hidden="true" />
            </CompactPageLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

interface CompactPageLinkProps {
  children: ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}

function CompactPageLink({ children, disabled, label, onClick }: CompactPageLinkProps) {
  return (
    <PaginationLink
      aria-label={label}
      aria-disabled={disabled}
      className={cn(disabled && 'pointer-events-none opacity-40')}
      href="#"
      tabIndex={disabled ? -1 : undefined}
      onClick={(event) => {
        event.preventDefault();
        if (!disabled) {
          onClick();
        }
      }}
    >
      {children}
    </PaginationLink>
  );
}
