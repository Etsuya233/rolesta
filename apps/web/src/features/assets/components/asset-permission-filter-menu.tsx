import { ListFilterIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { FieldLegend, FieldSet } from "../../../components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../../components/ui/toggle-group";
import type { AssetScope } from "./asset-scope-tabs";

export interface AssetPermissionFilterMenuProps {
  buttonLabel: string;
  scope: AssetScope;
  onScopeChange: (scope: AssetScope) => void;
}

export function AssetPermissionFilterMenu({
  buttonLabel,
  scope,
  onScopeChange,
}: AssetPermissionFilterMenuProps) {
  const { t } = useTranslation();
  const scopeOptions: Array<{ value: AssetScope; label: string }> = [
    { value: "all", label: t("assets.scope.all") },
    { value: "mine", label: t("assets.scope.mine") },
    { value: "public", label: t("assets.scope.public") },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={buttonLabel}
          aria-pressed={scope !== "all"}
          size="icon"
          type="button"
          variant={scope === "all" ? "outline" : "secondary"}
        >
          <ListFilterIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <FieldSet className="gap-2">
          <FieldLegend variant="label">
            {t("assets.filters.permission")}
          </FieldLegend>
          <ToggleGroup
            className="grid w-full grid-cols-3"
            spacing={0}
            type="single"
            value={scope}
            variant="outline"
            onValueChange={(value) => {
              if (value !== "") {
                onScopeChange(value as AssetScope);
              }
            }}
          >
            {scopeOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                aria-label={option.label}
                value={option.value}
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>
      </PopoverContent>
    </Popover>
  );
}
