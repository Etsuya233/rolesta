import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";
import { AssetTagList } from "../../assets/components/asset-tag-list";
import type { CharacterSummaryResponse } from "../api/characters-api";

export interface CharacterCardListItemProps {
  character: CharacterSummaryResponse;
  onClick: () => void;
}

export function CharacterCardListItem({
  character,
  onClick,
}: CharacterCardListItemProps) {
  return (
    <button
      className="group flex w-full items-start gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left shadow-sm transition-all hover:border-primary/30 hover:bg-muted/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
      type="button"
      onClick={onClick}
    >
      <Avatar className="mt-0.5" size="lg">
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
          <Badge
            className={cn(
              "shrink-0",
              character.visibility === "public" &&
                "border-primary/30 text-primary",
            )}
            variant="outline"
          >
            {character.visibility === "public" ? "公开" : "私有"}
          </Badge>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <AssetTagList className="flex-1" maxItems={3} tags={character.tags} />
          <div className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            <span>v{character.version}</span>
            <span>{usageLabel(character.usageCount)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function usageLabel(usageCount: number): string {
  return usageCount > 0 ? `${usageCount} 次` : "未使用";
}
