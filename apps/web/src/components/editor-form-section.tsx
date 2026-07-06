import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { FieldGroup } from "./ui/field";

export function EditorFormSection({
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
      className="group/editor-form-section relative overflow-hidden bg-background"
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
