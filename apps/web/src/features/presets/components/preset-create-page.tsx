import { useTranslation } from 'react-i18next';
import { usePresetDraftSessionActions } from '../hooks/use-preset-draft-sessions';
import { MobileTopBar } from '../../assets/components/mobile-top-bar';
import { PresetMainEditor } from './preset-main-editor';
import { editPresetPage, type PresetPage, presetSessionKey } from './preset-pages';
import { PresetStackPage } from './preset-stack-page';

export function PresetCreatePage({
  page,
  replacePage,
  onBack,
}: {
  page: Extract<PresetPage, { name: 'create' }>;
  replacePage: (page: PresetPage) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { moveSessionToPreset } = usePresetDraftSessionActions();

  return (
    <PresetStackPage>
      <MobileTopBar title={t('presets.editor.createTitle')} onBack={onBack} />
      <PresetMainEditor
        sessionKey={page.sessionKey}
        submitLabel={t('presets.editor.createSubmit')}
        onCreated={(preset) => {
          moveSessionToPreset(page.sessionKey, presetSessionKey(preset.id), preset);
          replacePage(editPresetPage(preset.id));
        }}
      />
    </PresetStackPage>
  );
}
