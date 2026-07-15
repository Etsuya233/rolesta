import { Import, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { MobileTopBar } from '../../assets/components/mobile-top-bar';
import { CharacterCardListPanel } from './character-card-list-panel';
import { CharacterStackPage } from './character-stack-page';

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
  const { t } = useTranslation();

  return (
    <CharacterStackPage>
      <MobileTopBar
        actions={
          <>
            <IconAction label={t('characters.list.importAction')} onClick={onImport}>
              <Import aria-hidden="true" />
            </IconAction>
            <IconAction label={t('characters.list.createAction')} onClick={onCreate}>
              <Plus aria-hidden="true" />
            </IconAction>
          </>
        }
        title={t('characters.list.title')}
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
    <Button
      aria-label={label}
      className="size-10"
      size="icon-lg"
      type="button"
      variant="ghost"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
