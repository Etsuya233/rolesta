import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../../../components/ui/input";
import { AssetScopeTabs } from "../../assets/components/asset-scope-tabs";
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
          <Input
            aria-label={t("characters.list.searchLabel")}
            placeholder={t("characters.list.searchPlaceholder")}
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              resetPageIndex();
            }}
          />
          <AssetScopeTabs
            value={scope}
            onChange={(value) => {
              setScope(value);
              resetPageIndex();
            }}
          />
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
  isError,
  isLoading,
  onSelectCharacter,
}: {
  characters: CharacterSummaryResponse[];
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
