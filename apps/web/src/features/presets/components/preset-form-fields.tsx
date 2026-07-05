import type { ChangeEventHandler, ReactNode } from "react";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion";
import { Button } from "../../../components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "../../../components/ui/field";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { cn } from "../../../lib/utils";

export function PresetFormSection({
  title,
  value,
  children,
  description,
}: {
  title: string;
  value: string;
  children: ReactNode;
  description?: string;
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate">{title}</span>
          {description ? (
            <span className="text-xs font-normal text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <FieldGroup className="gap-4">{children}</FieldGroup>
      </AccordionContent>
    </AccordionItem>
  );
}

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
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value === "" ? null : Number(event.target.value))
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <Field data-disabled={disabled}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        className="min-h-40 resize-y overflow-auto [field-sizing:fixed]"
        disabled={disabled}
        id={id}
        rows={rows}
        style={{ fieldSizing: "fixed" }}
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
      <Select
        disabled={disabled}
        value={value}
        onValueChange={(next) => onChange(next as TValue)}
      >
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
        "flex min-h-10 items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm",
        disabled && "opacity-60",
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

export function FormError({ children }: { children: string }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
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
      className={cn("w-full", className)}
      disabled={disabled}
      type="button"
      variant="outline"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
