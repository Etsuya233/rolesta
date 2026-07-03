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
  const lastPageIndex = Math.max(totalPages - 1, 0);
  const canGoPrevious = pageIndex > 0;
  const canGoNext = pageIndex < lastPageIndex;

  return (
    <div className="flex items-center justify-between gap-3">
      <select
        aria-label="每页数量"
        className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
        value={pageSize}
        onChange={(event) => onPageSizeChange(Number(event.target.value))}
      >
        {pageSizeOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1">
        <PageButton disabled={!canGoPrevious} label="第一页" onClick={() => onPageIndexChange(0)}>
          «
        </PageButton>
        <PageButton
          disabled={!canGoPrevious}
          label="上一页"
          onClick={() => onPageIndexChange(Math.max(pageIndex - 1, 0))}
        >
          ‹
        </PageButton>
        <span className="min-w-14 text-center text-xs text-muted-foreground">
          {pageIndex + 1}/{Math.max(totalPages, 1)}
        </span>
        <PageButton
          disabled={!canGoNext}
          label="下一页"
          onClick={() => onPageIndexChange(Math.min(pageIndex + 1, lastPageIndex))}
        >
          ›
        </PageButton>
        <PageButton
          disabled={!canGoNext}
          label="最后一页"
          onClick={() => onPageIndexChange(lastPageIndex)}
        >
          »
        </PageButton>
      </div>
    </div>
  );
}

interface PageButtonProps {
  children: string;
  disabled: boolean;
  label: string;
  onClick: () => void;
}

function PageButton({ children, disabled, label, onClick }: PageButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-md border border-border text-base transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30',
        disabled && 'pointer-events-none opacity-40',
      )}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
