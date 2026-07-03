export interface AssetSortOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

export interface AssetSortMenuProps<TSort extends string = string> {
  sort: TSort;
  direction: 'asc' | 'desc';
  options: Array<AssetSortOption<TSort>>;
  onSortChange: (value: TSort) => void;
  onDirectionChange: (value: 'asc' | 'desc') => void;
}

export function AssetSortMenu<TSort extends string = string>({
  sort,
  direction,
  options,
  onSortChange,
  onDirectionChange,
}: AssetSortMenuProps<TSort>) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <select
        aria-label="排序"
        className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
        value={sort}
        onChange={(event) => onSortChange(event.target.value as TSort)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        aria-label="排序方向"
        className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
        value={direction}
        onChange={(event) => onDirectionChange(event.target.value as 'asc' | 'desc')}
      >
        <option value="desc">降序</option>
        <option value="asc">升序</option>
      </select>
    </div>
  );
}
