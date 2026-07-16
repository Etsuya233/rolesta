import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Field, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import type { AssetSortOption } from './asset-sort-menu';

export interface AssetSortPopoverProps<TSort extends string = string> {
  buttonLabel: string;
  sort: TSort;
  direction: 'asc' | 'desc';
  options: Array<AssetSortOption<TSort>>;
  active?: boolean;
  onSortChange: (value: TSort) => void;
  onDirectionChange: (value: 'asc' | 'desc') => void;
}

export function AssetSortPopover<TSort extends string = string>({
  buttonLabel,
  sort,
  direction,
  options,
  active = false,
  onSortChange,
  onDirectionChange,
}: AssetSortPopoverProps<TSort>) {
  const { t } = useTranslation();

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                aria-label={buttonLabel}
                aria-pressed={active}
                size="icon"
                type="button"
                variant={active ? 'secondary' : 'outline'}
              >
                <ArrowUpDownIcon />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>{buttonLabel}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent align="end" className="w-72">
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel>{t('assets.sort.fieldLabel')}</FieldLabel>
            <Select value={sort} onValueChange={(value) => onSortChange(value as TSort)}>
              <SelectTrigger className="w-full">
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
          </Field>
          <Field>
            <FieldLabel>{t('assets.sort.directionLabel')}</FieldLabel>
            <ToggleGroup
              className="grid w-full grid-cols-2"
              spacing={0}
              type="single"
              value={direction}
              variant="outline"
              onValueChange={(value) => {
                if (value === 'asc' || value === 'desc') onDirectionChange(value);
              }}
            >
              <ToggleGroupItem value="asc">
                <ArrowUpIcon data-icon="inline-start" />
                {t('assets.sort.ascending')}
              </ToggleGroupItem>
              <ToggleGroupItem value="desc">
                <ArrowDownIcon data-icon="inline-start" />
                {t('assets.sort.descending')}
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
        </FieldGroup>
      </PopoverContent>
    </Popover>
  );
}
