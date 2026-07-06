import type { ChangeEventHandler, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
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
import { cn } from "../../../lib/utils";

export function ModelProviderFormSection({
  title,
  value,
  children,
  icon: Icon,
  summary,
}: {
  title: string;
  value: string;
  children: ReactNode;
  icon: LucideIcon;
  summary: string;
}) {
  return (
    <AccordionItem
      className="group/model-provider-section relative overflow-hidden bg-background"
      value={value}
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <span className="flex min-w-0 flex-1 items-start gap-3 pr-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          <span className="grid min-w-0 flex-1 gap-1">
            <span className="truncate text-base font-semibold">{title}</span>
            <span className="truncate text-sm font-normal text-muted-foreground">
              {summary}
            </span>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-5 pl-16">
        <FieldGroup className="gap-4">{children}</FieldGroup>
      </AccordionContent>
    </AccordionItem>
  );
}

export function ModelProviderTextField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  description,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  description?: string;
  placeholder?: string;
  type?: "text" | "password";
}) {
  return (
    <Field data-disabled={disabled}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        disabled={disabled}
        id={id}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={onChange}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

export function ModelProviderSelectField<TValue extends string>({
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
        <SelectTrigger className="w-full" id={id}>
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

export function FormError({ children }: { children: string }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

export function FormNotice({ children }: { children: string }) {
  return (
    <Alert>
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
