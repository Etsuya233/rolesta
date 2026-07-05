import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

export interface AssetSortOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

export interface AssetSortMenuProps<TSort extends string = string> {
  sort: TSort;
  direction: "asc" | "desc";
  options: Array<AssetSortOption<TSort>>;
  onSortChange: (value: TSort) => void;
  onDirectionChange: (value: "asc" | "desc") => void;
}

export function AssetSortMenu<TSort extends string = string>({
  sort,
  direction,
  options,
  onSortChange,
  onDirectionChange,
}: AssetSortMenuProps<TSort>) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-2">
      <Select
        value={sort}
        onValueChange={(value) => onSortChange(value as TSort)}
      >
        <SelectTrigger aria-label="排序字段" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={direction}
        onValueChange={(value) => onDirectionChange(value as "asc" | "desc")}
      >
        <SelectTrigger aria-label="排序方向" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="desc">降序</SelectItem>
            <SelectItem value="asc">升序</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
