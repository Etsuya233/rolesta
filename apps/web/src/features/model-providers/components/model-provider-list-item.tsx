import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import type { ModelProviderSummaryResponse } from "../api/model-providers-api";
import { AssetDefaultBadge } from "../../chat-preferences/components/asset-default-badge";

export function ModelProviderListItem({
  config,
  isDefault = false,
  onSelect,
}: {
  config: ModelProviderSummaryResponse;
  isDefault?: boolean;
  onSelect: (configId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Button
      className="h-auto w-full justify-start rounded-none border-b border-border px-4 py-3 text-left"
      type="button"
      variant="ghost"
      onClick={() => onSelect(config.id)}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{config.name}</span>
          {isDefault ? <AssetDefaultBadge kind="modelProvider" /> : null}
        </span>
        <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{providerLabel(config.providerKind)}</span>
          <span className="max-w-full truncate">{config.baseUrl}</span>
          <span>
            {config.defaultModelName || t("modelProviders.list.noDefaultModel")}
          </span>
          <span>
            {config.credentialMode === "vault"
              ? config.apiKeyName
              : t("modelProviders.editor.credentials.manual")}
          </span>
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
    </Button>
  );
}

function providerLabel(providerKind: string): string {
  if (providerKind === "openai-compatible") {
    return "OpenAI Compatible";
  }

  if (providerKind === "z-ai") {
    return "Z.AI";
  }

  return providerKind
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
