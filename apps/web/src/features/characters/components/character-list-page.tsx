import { Import, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { CharacterCardListPanel } from "./character-card-list-panel";
import { CharacterStackPage } from "./character-stack-page";

export interface CharacterListPageProps {
  onBack: () => void;
  onCreate: () => void;
  onImport: () => void;
  onSelectCharacter: (characterId: string) => void;
}

export function CharacterListPage({
  onBack,
  onCreate,
  onImport,
  onSelectCharacter,
}: CharacterListPageProps) {
  return (
    <CharacterStackPage>
      <MobileTopBar
        actions={
          <>
            <IconAction label="导入角色卡" onClick={onImport}>
              <Import aria-hidden="true" className="size-5" />
            </IconAction>
            <IconAction label="新增角色卡" onClick={onCreate}>
              <Plus aria-hidden="true" className="size-5" />
            </IconAction>
          </>
        }
        title="角色卡"
        onBack={onBack}
      />
      <CharacterCardListPanel onSelectCharacter={onSelectCharacter} />
    </CharacterStackPage>
  );
}

function IconAction({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
