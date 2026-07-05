import { useTranslation } from "react-i18next";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { alternateGreetingsPage, type CharacterPage } from "./character-pages";
import { CharacterCardMainEditor } from "./character-card-main-editor";
import { CharacterStackPage } from "./character-stack-page";

export interface CharacterEditPageProps {
  page: Extract<CharacterPage, { name: "editMain" }>;
  onBack: () => void;
  pushPage: (page: CharacterPage) => void;
}

export function CharacterEditPage({
  page,
  onBack,
  pushPage,
}: CharacterEditPageProps) {
  const { t } = useTranslation();

  return (
    <CharacterStackPage>
      <MobileTopBar title={t("characters.editor.editTitle")} onBack={onBack} />
      <CharacterCardMainEditor
        characterId={page.characterId}
        sessionKey={page.sessionKey}
        submitLabel={t("characters.editor.saveSubmit")}
        onOpenGreetings={() =>
          pushPage(alternateGreetingsPage(page.characterId, page.sessionKey))
        }
      />
    </CharacterStackPage>
  );
}
