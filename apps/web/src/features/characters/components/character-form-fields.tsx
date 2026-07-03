import type { ChangeEventHandler, ReactNode } from 'react';

const inputClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50';

export const textareaClassName =
  'flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50';

export interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled = false,
  placeholder,
}: TextFieldProps) {
  return (
    <label className="block space-y-2" htmlFor={id}>
      <span className="text-sm font-medium leading-none">{label}</span>
      <input
        autoComplete={autoComplete}
        className={inputClassName}
        disabled={disabled}
        id={id}
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

export interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  disabled?: boolean;
  rows?: number;
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  rows = 5,
}: TextAreaFieldProps) {
  return (
    <label className="block space-y-2" htmlFor={id}>
      <span className="text-sm font-medium leading-none">{label}</span>
      <textarea
        className={textareaClassName}
        disabled={disabled}
        id={id}
        rows={rows}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

export interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  children: ReactNode;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
}

export function SelectField({
  id,
  label,
  value,
  children,
  onChange,
  disabled = false,
}: SelectFieldProps) {
  return (
    <label className="block space-y-2" htmlFor={id}>
      <span className="text-sm font-medium leading-none">{label}</span>
      <select
        className={inputClassName}
        disabled={disabled}
        id={id}
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
    </label>
  );
}

export function FieldError({ children }: { children: string }) {
  return (
    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {children}
    </p>
  );
}

export function PrimaryButton({
  children,
  disabled = false,
}: {
  children: string;
  disabled?: boolean;
}) {
  return (
    <button
      className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
      type="submit"
    >
      {children}
    </button>
  );
}

export function NeutralButton({
  children,
  disabled = false,
  onClick,
}: {
  children: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
