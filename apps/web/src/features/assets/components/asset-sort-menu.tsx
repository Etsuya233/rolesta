import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
      <Select
        value={sort}
        onValueChange={(value) => onSortChange(value as TSort)}
      >
        <SelectTrigger
          aria-label={t("assets.sort.fieldLabel")}
          className="w-full"
        >
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
        <SelectTrigger
          aria-label={t("assets.sort.directionLabel")}
          className="w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="desc">{t("assets.sort.descending")}</SelectItem>
            <SelectItem value="asc">{t("assets.sort.ascending")}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
