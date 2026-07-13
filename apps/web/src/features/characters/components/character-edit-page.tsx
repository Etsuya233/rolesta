import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "../../auth/hooks/use-current-user";
import { AssetDefaultButton } from "../../chat-preferences/components/asset-default-button";
import { getCharacter } from "../api/characters-api";
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
  const currentUser = useCurrentUser();
  const character = useQuery({
    queryKey: ["character", page.characterId],
    queryFn: () => getCharacter(page.characterId),
  });

  return (
    <CharacterStackPage>
      <MobileTopBar
        actions={
          <AssetDefaultButton
            assetId={page.characterId}
            currentUserId={currentUser.data?.user?.id}
            kind="persona"
            ownerUserId={character.data?.ownerUserId}
          />
        }
        title={t("characters.editor.editTitle")}
        onBack={onBack}
      />
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
