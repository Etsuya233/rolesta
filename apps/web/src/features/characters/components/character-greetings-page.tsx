import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { useCharacterDraftSession } from "../hooks/use-character-draft-sessions";
import type { CharacterPage } from "./character-pages";
import { CharacterGreetingsEditor } from "./character-greetings-editor";
import { CharacterStackPage } from "./character-stack-page";

export interface CharacterGreetingsPageProps {
  page: Extract<CharacterPage, { name: "alternateGreetings" }>;
  onBack: () => void;
}

export function CharacterGreetingsPage({
  page,
  onBack,
}: CharacterGreetingsPageProps) {
  const { form, setForm, isPending } = useCharacterDraftSession({
    sessionKey: page.sessionKey,
    characterId: page.characterId,
  });

  return (
    <CharacterStackPage>
      <MobileTopBar title="开场消息" onBack={onBack} />
      <div className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto">
        <CharacterGreetingsEditor
          disabled={isPending}
          greetings={form.alternateGreetings}
          onChange={(alternateGreetings) =>
            setForm({ ...form, alternateGreetings })
          }
        />
      </div>
    </CharacterStackPage>
  );
}
