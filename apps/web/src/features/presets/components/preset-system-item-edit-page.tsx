import { useTranslation } from 'react-i18next';
import { MobileTopBar } from '../../assets/components/mobile-top-bar';
import type { PresetPage } from './preset-pages';
import { PresetStackPage } from './preset-stack-page';
import { PresetSystemItemEditor } from './preset-system-item-editor';

export function PresetSystemItemEditPage({
  page,
  onBack,
}: {
  page: Extract<PresetPage, { name: 'systemItemEdit' }>;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  return (
    <PresetStackPage>
      <MobileTopBar title={t('presets.systemItems.editTitle')} onBack={onBack} />
      <PresetSystemItemEditor
        itemId={page.itemId}
        presetId={page.presetId}
        sessionKey={page.sessionKey}
      />
    </PresetStackPage>
  );
}
