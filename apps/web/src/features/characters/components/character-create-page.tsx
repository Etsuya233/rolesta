import { useTranslation } from 'react-i18next';
import { MobileTopBar } from '../../assets/components/mobile-top-bar';
import { useCharacterDraftSessionActions } from '../hooks/use-character-draft-sessions';
import { characterSessionKey, editCharacterPage, type CharacterPage } from './character-pages';
import { CharacterCardMainEditor } from './character-card-main-editor';
import { CharacterStackPage } from './character-stack-page';

export interface CharacterCreatePageProps {
  page: Extract<CharacterPage, { name: 'create' }>;
  onBack: () => void;
  replacePage: (page: CharacterPage) => void;
}

export function CharacterCreatePage({ page, onBack, replacePage }: CharacterCreatePageProps) {
  const { t } = useTranslation();
  const { moveSessionToCharacter } = useCharacterDraftSessionActions();

  return (
    <CharacterStackPage>
      <MobileTopBar title={t('characters.editor.createTitle')} onBack={onBack} />
      <CharacterCardMainEditor
        sessionKey={page.sessionKey}
        submitLabel={t('characters.editor.createSubmit')}
        onCreated={(character) => {
          moveSessionToCharacter(page.sessionKey, characterSessionKey(character.id), character);
          replacePage(editCharacterPage(character.id));
        }}
      />
    </CharacterStackPage>
  );
}
