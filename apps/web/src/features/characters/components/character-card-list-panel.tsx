import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../../../components/ui/input";
import { AssetPermissionFilterMenu } from "../../assets/components/asset-permission-filter-menu";
import { AssetSortMenu } from "../../assets/components/asset-sort-menu";
import { PageControls } from "../../assets/components/page-controls";
import type {
  CharacterListScope,
  CharacterSortKey,
  CharacterSummaryResponse,
  SortDirection,
} from "../api/characters-api";
import { listCharacters } from "../api/characters-api";
import { CharacterCardListItem } from "./character-card-list-item";
import { useAssetDefaults } from "../../chat-preferences/hooks/use-asset-defaults";

export interface CharacterCardListPanelProps {
  onSelectCharacter: (characterId: string) => void;
}

export function CharacterCardListPanel({
  onSelectCharacter,
}: CharacterCardListPanelProps) {
  const { t } = useTranslation();
  const [scope, setScope] = useState<CharacterListScope>("all");
  const [sort, setSort] = useState<CharacterSortKey>("createdAt");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [q, setQ] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const assetDefaultsQuery = useAssetDefaults();

  const charactersQuery = useQuery({
    queryKey: [
      "characters",
      { scope, sort, direction, pageIndex, pageSize, q },
    ],
    queryFn: () =>
      listCharacters({ scope, sort, direction, pageIndex, pageSize, q }),
  });

  const page = charactersQuery.data;
  const characterSortOptions: Array<{
    value: CharacterSortKey;
    label: string;
  }> = [
    { value: "createdAt", label: t("characters.list.sort.createdAt") },
    { value: "updatedAt", label: t("characters.list.sort.updatedAt") },
    { value: "name", label: t("characters.list.sort.name") },
    { value: "lastUsedAt", label: t("characters.list.sort.lastUsedAt") },
    { value: "usageCount", label: t("characters.list.sort.usageCount") },
  ];

  function resetPageIndex() {
    setPageIndex(0);
  }

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Input
              aria-label={t("characters.list.searchLabel")}
              className="min-w-0 flex-1"
              placeholder={t("characters.list.searchPlaceholder")}
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                resetPageIndex();
              }}
            />
            <AssetPermissionFilterMenu
              buttonLabel={t("characters.list.filterButton")}
              scope={scope}
              onScopeChange={(value) => {
                setScope(value);
                resetPageIndex();
              }}
            />
          </div>
          <AssetSortMenu
            direction={direction}
            options={characterSortOptions}
            sort={sort}
            onDirectionChange={(value) => {
              setDirection(value);
              resetPageIndex();
            }}
            onSortChange={(value) => {
              setSort(value);
              resetPageIndex();
            }}
          />
          <PageControls
            pageIndex={page?.pageIndex ?? pageIndex}
            pageSize={page?.pageSize ?? pageSize}
            totalPages={page?.totalPages ?? 1}
            onPageIndexChange={setPageIndex}
            onPageSizeChange={(value) => {
              setPageSize(value);
              resetPageIndex();
            }}
          />
        </div>

        <CharacterListContent
          characters={page?.items ?? []}
          defaultPersonaId={
            assetDefaultsQuery.isError
              ? undefined
              : assetDefaultsQuery.data?.personaCharacterId
          }
          isError={charactersQuery.isError}
          isLoading={charactersQuery.isLoading}
          onSelectCharacter={onSelectCharacter}
        />
      </div>
    </section>
  );
}

function CharacterListContent({
  characters,
  defaultPersonaId,
  isError,
  isLoading,
  onSelectCharacter,
}: {
  characters: CharacterSummaryResponse[];
  defaultPersonaId: string | null | undefined;
  isError: boolean;
  isLoading: boolean;
  onSelectCharacter: (characterId: string) => void;
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return <StatusMessage>{t("characters.list.loading")}</StatusMessage>;
  }

  if (isError) {
    return <StatusMessage>{t("characters.list.loadFailed")}</StatusMessage>;
  }

  if (characters.length === 0) {
    return <StatusMessage>{t("characters.list.empty")}</StatusMessage>;
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {characters.map((character) => (
        <CharacterCardListItem
          key={character.id}
          character={character}
          isDefault={character.id === defaultPersonaId}
          onClick={() => onSelectCharacter(character.id)}
        />
      ))}
    </div>
  );
}

function StatusMessage({ children }: { children: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center px-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
