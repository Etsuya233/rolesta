import { useTranslation } from 'react-i18next';
import { MobileTopBar } from '../../assets/components/mobile-top-bar';
import { editCharacterPage, type CharacterPage } from './character-pages';
import { CharacterImportPanel } from './character-import-panel';
import { CharacterStackPage } from './character-stack-page';

export interface CharacterImportPageProps {
  onBack: () => void;
  replacePage: (page: CharacterPage) => void;
}

export function CharacterImportPage({ onBack, replacePage }: CharacterImportPageProps) {
  const { t } = useTranslation();

  return (
    <CharacterStackPage>
      <MobileTopBar title={t('characters.import.title')} onBack={onBack} />
      <CharacterImportPanel
        onImported={(characterId) => replacePage(editCharacterPage(characterId))}
      />
    </CharacterStackPage>
  );
}
