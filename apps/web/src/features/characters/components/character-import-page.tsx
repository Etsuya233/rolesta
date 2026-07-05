import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { editCharacterPage, type CharacterPage } from "./character-pages";
import { CharacterImportPanel } from "./character-import-panel";
import { CharacterStackPage } from "./character-stack-page";

export interface CharacterImportPageProps {
  onBack: () => void;
  replacePage: (page: CharacterPage) => void;
}

export function CharacterImportPage({
  onBack,
  replacePage,
}: CharacterImportPageProps) {
  return (
    <CharacterStackPage>
      <MobileTopBar title="导入角色卡" onBack={onBack} />
      <CharacterImportPanel
        onImported={(characterId) => replacePage(editCharacterPage(characterId))}
      />
    </CharacterStackPage>
  );
}
