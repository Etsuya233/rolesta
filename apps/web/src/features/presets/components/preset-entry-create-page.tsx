import { useTranslation } from 'react-i18next';
import { MobileTopBar } from '../../assets/components/mobile-top-bar';
import { PresetEntryEditor } from './preset-entry-editor';
import type { PresetPage } from './preset-pages';
import { PresetStackPage } from './preset-stack-page';

export function PresetEntryCreatePage({
  page,
  onBack,
}: {
  page: Extract<PresetPage, { name: 'entryCreate' }>;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  return (
    <PresetStackPage>
      <MobileTopBar title={t('presets.entries.createTitle')} onBack={onBack} />
      <PresetEntryEditor
        presetId={page.presetId}
        sessionKey={page.sessionKey}
        submitLabel={t('presets.entries.createSubmit')}
        onSaved={onBack}
      />
    </PresetStackPage>
  );
}
