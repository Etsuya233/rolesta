import { ChevronFirst, ChevronLast } from "lucide-react";
import type { ReactNode } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../../components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { cn } from "../../../lib/utils";

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
      <Select
        value={String(pageSize)}
        onValueChange={(value) => onPageSizeChange(Number(value))}
      >
        <SelectTrigger aria-label="每页数量" className="w-18">
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
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <CompactPageLink
              disabled={!canGoPrevious}
              label="第一页"
              onClick={() => onPageIndexChange(0)}
            >
              <ChevronFirst aria-hidden="true" />
            </CompactPageLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious
              aria-disabled={!canGoPrevious}
              className={cn(!canGoPrevious && "pointer-events-none opacity-40")}
              href="#"
              tabIndex={canGoPrevious ? undefined : -1}
              text="上一页"
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
              aria-disabled={!canGoNext}
              className={cn(!canGoNext && "pointer-events-none opacity-40")}
              href="#"
              tabIndex={canGoNext ? undefined : -1}
              text="下一页"
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
              label="最后一页"
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

function CompactPageLink({
  children,
  disabled,
  label,
  onClick,
}: CompactPageLinkProps) {
  return (
    <PaginationLink
      aria-label={label}
      aria-disabled={disabled}
      className={cn(disabled && "pointer-events-none opacity-40")}
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
