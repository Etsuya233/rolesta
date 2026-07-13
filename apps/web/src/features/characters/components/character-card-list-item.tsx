import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";
import { AssetTagList } from "../../assets/components/asset-tag-list";
import { AssetDefaultBadge } from "../../chat-preferences/components/asset-default-badge";
import type { CharacterSummaryResponse } from "../api/characters-api";

export interface CharacterCardListItemProps {
  character: CharacterSummaryResponse;
  isDefault?: boolean;
  onClick: () => void;
}

export function CharacterCardListItem({
  character,
  isDefault = false,
  onClick,
}: CharacterCardListItemProps) {
  const { t } = useTranslation();

  return (
    <button
      className="group flex w-full items-start gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left shadow-sm transition-all hover:border-primary/30 hover:bg-muted/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
      type="button"
      onClick={onClick}
    >
      <Avatar className="mt-0.5" size="lg">
        {character.avatar ? (
          <AvatarImage
            alt={character.name}
            sizes="40px"
            src={character.avatar.sources["64"] ?? character.avatar.sources["128"]}
            srcSet={[
              character.avatar.sources["64"] ? `${character.avatar.sources["64"]} 64w` : null,
              character.avatar.sources["128"] ? `${character.avatar.sources["128"]} 128w` : null,
              character.avatar.sources["256"] ? `${character.avatar.sources["256"]} 256w` : null,
            ]
              .filter(Boolean)
              .join(", ")}
          />
        ) : null}
        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
          {character.name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold leading-5 text-card-foreground">
              {character.name}
            </h2>
            {character.comment ? (
              <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                {character.comment}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {isDefault ? <AssetDefaultBadge kind="persona" /> : null}
            <Badge
              className={cn(
                "shrink-0",
                character.visibility === "public" &&
                  "border-primary/30 text-primary",
              )}
              variant="outline"
            >
              {character.visibility === "public"
                ? t("characters.list.publicVisibility")
                : t("characters.list.privateVisibility")}
            </Badge>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <AssetTagList className="flex-1" maxItems={3} tags={character.tags} />
          <div className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            <span>v{character.version}</span>
            <span>
              {character.usageCount > 0
                ? t("characters.list.usageCount", {
                    count: character.usageCount,
                  })
                : t("characters.list.unused")}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
