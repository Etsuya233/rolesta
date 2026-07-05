import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
  hidden?: boolean;
  onSelectCharacter: (characterId: string) => void;
}

const characterSortOptions: Array<{ value: CharacterSortKey; label: string }> =
  [
    { value: "createdAt", label: "创建时间" },
    { value: "updatedAt", label: "更新时间" },
    { value: "name", label: "A-Z" },
    { value: "lastUsedAt", label: "最近使用" },
    { value: "usageCount", label: "最常使用" },
  ];

export function CharacterCardListPanel({
  hidden = false,
  onSelectCharacter,
}: CharacterCardListPanelProps) {
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

  function resetPageIndex() {
    setPageIndex(0);
  }

  return (
    <section
      aria-hidden={hidden}
      className={hidden ? "hidden" : "min-h-0 flex-1 overflow-y-auto"}
    >
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
          <Input
            aria-label="搜索角色卡"
            placeholder="搜索名称、注释、标签"
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
  if (isLoading) {
    return <StatusMessage>正在加载角色卡</StatusMessage>;
  }

  if (isError) {
    return <StatusMessage>角色卡加载失败</StatusMessage>;
  }

  if (characters.length === 0) {
    return <StatusMessage>暂无角色卡</StatusMessage>;
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
