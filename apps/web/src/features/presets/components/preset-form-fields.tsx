import type { ChangeEventHandler } from 'react';
import { EditorFormSection } from '../../../components/editor-form-section';
import { Button } from '../../../components/ui/button';
import { Field, FieldDescription, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { cn } from '../../../lib/utils';

export { EditorFormSection as PresetFormSection };

export function PresetTextField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  description,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  description?: string;
  placeholder?: string;
}) {
  return (
    <Field data-disabled={disabled}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        disabled={disabled}
        id={id}
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={onChange}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

export function PresetNumberField({
  id,
  label,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <Field data-disabled={disabled}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        disabled={disabled}
        id={id}
        inputMode="decimal"
        type="number"
        value={value ?? ''}
        onChange={(event) =>
          onChange(event.target.value === '' ? null : Number(event.target.value))
        }
      />
    </Field>
  );
}

export function PresetTextAreaField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  rows = 8,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  disabled?: boolean;
  rows?: number;
  className?: string;
}) {
  return (
    <Field data-disabled={disabled}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        className={cn('min-h-40 resize-y overflow-auto [field-sizing:fixed]', className)}
        disabled={disabled}
        id={id}
        rows={rows}
        style={{ fieldSizing: 'fixed' }}
        value={value}
        onChange={onChange}
      />
    </Field>
  );
}

export function PresetSelectField<TValue extends string>({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: TValue;
  options: Array<{ value: TValue; label: string }>;
  onChange: (value: TValue) => void;
  disabled?: boolean;
}) {
  return (
    <Field data-disabled={disabled}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select disabled={disabled} value={value} onValueChange={(next) => onChange(next as TValue)}>
        <SelectTrigger id={id}>
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
  );
}

export function PresetCheckboxField({
  id,
  label,
  checked,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        'flex min-h-10 items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm',
        disabled && 'opacity-60',
      )}
      htmlFor={id}
    >
      <span>{label}</span>
      <input
        checked={checked}
        className="size-4 accent-primary"
        disabled={disabled}
        id={id}
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export function FormSubmitButton({
  children,
  disabled = false,
}: {
  children: string;
  disabled?: boolean;
}) {
  return (
    <Button className="w-full" disabled={disabled} type="submit">
      {children}
    </Button>
  );
}

export function FormActionButton({
  children,
  disabled = false,
  className,
  onClick,
}: {
  children: string;
  disabled?: boolean;
  className?: string;
  onClick: () => void;
}) {
  return (
    <Button
      className={cn('w-full', className)}
      disabled={disabled}
      type="button"
      variant="outline"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
