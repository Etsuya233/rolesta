import { CharacterCreatePage } from "./character-create-page";
import { CharacterEditPage } from "./character-edit-page";
import { CharacterGreetingsPage } from "./character-greetings-page";
import { CharacterImportPage } from "./character-import-page";
import { CharacterListPage } from "./character-list-page";
import {
  createCharacterPage,
  editCharacterPage,
  importCharacterPage,
  type CharacterPage,
} from "./character-pages";

export interface CharacterPageRendererProps {
  page: CharacterPage;
  onRootBack: () => void;
  popPage: () => void;
  pushPage: (page: CharacterPage) => void;
  replacePage: (page: CharacterPage) => void;
}

export function CharacterPageRenderer({
  page,
  onRootBack,
  popPage,
  pushPage,
  replacePage,
}: CharacterPageRendererProps) {
  if (page.name === "list") {
    return (
      <CharacterListPage
        onBack={onRootBack}
        onCreate={() => pushPage(createCharacterPage())}
        onImport={() => pushPage(importCharacterPage())}
        onSelectCharacter={(characterId) =>
          pushPage(editCharacterPage(characterId))
        }
      />
    );
  }

  if (page.name === "create") {
    return (
      <CharacterCreatePage
        page={page}
        replacePage={replacePage}
        onBack={popPage}
      />
    );
  }

  if (page.name === "editMain") {
    return (
      <CharacterEditPage page={page} pushPage={pushPage} onBack={popPage} />
    );
  }

  if (page.name === "alternateGreetings") {
    return <CharacterGreetingsPage page={page} onBack={popPage} />;
  }

  return <CharacterImportPage replacePage={replacePage} onBack={popPage} />;
}
