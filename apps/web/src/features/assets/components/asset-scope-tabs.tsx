import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";

export type AssetScope = "all" | "mine" | "public";

export interface AssetScopeTabsProps {
  value: AssetScope;
  onChange: (value: AssetScope) => void;
}

export function AssetScopeTabs({ value, onChange }: AssetScopeTabsProps) {
  const { t } = useTranslation();
  const scopeOptions: Array<{ value: AssetScope; label: string }> = [
    { value: "all", label: t("assets.scope.all") },
    { value: "mine", label: t("assets.scope.mine") },
    { value: "public", label: t("assets.scope.public") },
  ];

  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as AssetScope)}
    >
      <TabsList className="grid w-full grid-cols-3">
        {scopeOptions.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
