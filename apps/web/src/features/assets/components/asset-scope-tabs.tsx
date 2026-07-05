import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";

export type AssetScope = "all" | "mine" | "public";

export interface AssetScopeTabsProps {
  value: AssetScope;
  onChange: (value: AssetScope) => void;
}

const scopeOptions: Array<{ value: AssetScope; label: string }> = [
  { value: "all", label: "全部" },
  { value: "mine", label: "我的" },
  { value: "public", label: "公开" },
];

export function AssetScopeTabs({ value, onChange }: AssetScopeTabsProps) {
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
