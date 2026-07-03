import { cn } from '../../../lib/utils';

export type AssetScope = 'all' | 'mine' | 'public';

export interface AssetScopeTabsProps {
  value: AssetScope;
  onChange: (value: AssetScope) => void;
}

const scopeOptions: Array<{ value: AssetScope; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'mine', label: '我的' },
  { value: 'public', label: '公开' },
];

export function AssetScopeTabs({ value, onChange }: AssetScopeTabsProps) {
  return (
    <div className="grid grid-cols-3 rounded-md border border-border bg-muted/40 p-1">
      {scopeOptions.map((option) => (
        <button
          className={cn(
            'h-9 rounded-sm px-3 text-sm text-muted-foreground transition-colors hover:text-foreground',
            option.value === value && 'bg-background text-foreground shadow-sm',
          )}
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
