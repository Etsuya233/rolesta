import { Circle, CircleCheck, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import type { AssetDefaultsPatch } from "../api/chat-preferences-api";
import {
  useAssetDefaults,
  useUpdateAssetDefaults,
} from "../hooks/use-asset-defaults";

export type AssetDefaultKind = "persona" | "preset" | "modelProvider";

export function AssetDefaultButton({
  assetId,
  kind,
  ownerUserId,
  currentUserId,
}: {
  assetId: string;
  kind: AssetDefaultKind;
  ownerUserId: string | undefined;
  currentUserId: string | undefined;
}) {
  const { t } = useTranslation();
  const query = useAssetDefaults();
  const mutation = useUpdateAssetDefaults();

  if (!ownerUserId || !currentUserId || ownerUserId !== currentUserId) {
    return null;
  }

  if (query.isLoading) {
    return (
      <Button
        aria-label={t("chatPreferences.loadingDefault")}
        className="size-10"
        disabled
        size="icon-lg"
        type="button"
        variant="ghost"
      >
        <LoaderCircle
          aria-hidden="true"
          className="animate-spin"
          data-icon="inline-start"
        />
      </Button>
    );
  }

  const field = defaultField(kind);
  const isDefault = !query.isError && query.data?.[field] === assetId;
  const label = actionLabel(kind, isDefault, t);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label={label}
            className="size-10"
            disabled={mutation.isPending}
            size="icon-lg"
            type="button"
            variant="ghost"
            onClick={() =>
              mutation.mutate({ [field]: isDefault ? null : assetId })
            }
          >
            {isDefault ? (
              <CircleCheck aria-hidden="true" data-icon="inline-start" />
            ) : (
              <Circle aria-hidden="true" data-icon="inline-start" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function defaultField(kind: AssetDefaultKind): keyof AssetDefaultsPatch {
  switch (kind) {
    case "persona":
      return "personaCharacterId";
    case "preset":
      return "presetId";
    case "modelProvider":
      return "modelProviderId";
  }
}

function actionLabel(
  kind: AssetDefaultKind,
  isDefault: boolean,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  if (kind === "persona") {
    return t(
      isDefault
        ? "chatPreferences.actions.removePersona"
        : "chatPreferences.actions.setPersona",
    );
  }
  if (kind === "preset") {
    return t(
      isDefault
        ? "chatPreferences.actions.removePreset"
        : "chatPreferences.actions.setPreset",
    );
  }
  return t(
    isDefault
      ? "chatPreferences.actions.removeConnection"
      : "chatPreferences.actions.setConnection",
  );
}
