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

export interface CharacterFormSectionProps {
  title: string;
  value: string;
  children: ReactNode;
  description?: string;
}

export function CharacterFormSection({
  title,
  value,
  children,
  description,
}: CharacterFormSectionProps) {
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

export interface CharacterTextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
  disabled?: boolean;
  description?: string;
  placeholder?: string;
}

export function CharacterTextField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled = false,
  description,
  placeholder,
}: CharacterTextFieldProps) {
  return (
    <Field data-disabled={disabled}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        autoComplete={autoComplete}
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

export interface CharacterTextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  disabled?: boolean;
  description?: string;
  placeholder?: string;
  rows?: number;
}

export function CharacterTextAreaField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  description,
  placeholder,
  rows = 6,
}: CharacterTextAreaFieldProps) {
  return (
    <Field data-disabled={disabled}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        className="min-h-28 resize-y overflow-auto [field-sizing:fixed]"
        disabled={disabled}
        id={id}
        placeholder={placeholder}
        rows={rows}
        style={{ fieldSizing: "fixed" }}
        value={value}
        onChange={onChange}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

export interface CharacterSelectFieldProps<TValue extends string = string> {
  id: string;
  label: string;
  value: TValue;
  options: Array<{ value: TValue; label: string }>;
  onChange: (value: TValue) => void;
  disabled?: boolean;
  description?: string;
}

export function CharacterSelectField<TValue extends string = string>({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  description,
}: CharacterSelectFieldProps<TValue>) {
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
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
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
