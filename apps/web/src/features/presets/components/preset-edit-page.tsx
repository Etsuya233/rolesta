import { Download, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { getFormErrorMessage } from '../../../lib/forms/form-error';
import { notify } from '../../../lib/notifications/notify';
import { deletePreset, exportPreset } from '../api/presets-api';
import { MobileTopBar } from '../../assets/components/mobile-top-bar';
import { PresetMainEditor } from './preset-main-editor';
import { presetPromptListPage, type PresetPage } from './preset-pages';
import { PresetStackPage } from './preset-stack-page';
import { useCurrentUser } from '../../auth/hooks/use-current-user';
import { AssetDefaultButton } from '../../chat-preferences/components/asset-default-button';
import { assetDefaultsQueryKey } from '../../chat-preferences/hooks/use-asset-defaults';
import { getPreset } from '../api/presets-api';

export function PresetEditPage({
  page,
  pushPage,
  onBack,
}: {
  page: Extract<PresetPage, { name: 'editMain' }>;
  pushPage: (page: PresetPage) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const preset = useQuery({
    queryKey: ['preset', page.presetId],
    queryFn: () => getPreset(page.presetId),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deletePreset(page.presetId),
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['presets'] }),
        queryClient.invalidateQueries({ queryKey: assetDefaultsQueryKey }),
      ]);
      onBack();
    },
    onError(error) {
      notify.error({ title: getFormErrorMessage(error) });
    },
  });

  async function handleExport() {
    try {
      await downloadPreset(page.presetId);
    } catch (error) {
      notify.error({ title: getFormErrorMessage(error) });
    }
  }

  return (
    <PresetStackPage>
      <MobileTopBar
        actions={
          <>
            <AssetDefaultButton
              assetId={page.presetId}
              currentUserId={currentUser.data?.user?.id}
              kind="preset"
              ownerUserId={preset.data?.ownerUserId}
            />
            <Button
              aria-label={t('presets.editor.exportAction')}
              className="size-10"
              size="icon-lg"
              type="button"
              variant="ghost"
              onClick={() => void handleExport()}
            >
              <Download aria-hidden="true" />
            </Button>
            <Button
              aria-label={t('presets.editor.deleteAction')}
              className="size-10"
              disabled={deleteMutation.isPending}
              size="icon-lg"
              type="button"
              variant="ghost"
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </>
        }
        title={t('presets.editor.editTitle')}
        onBack={onBack}
      />
      <PresetMainEditor
        presetId={page.presetId}
        sessionKey={page.sessionKey}
        onOpenPromptList={() => pushPage(presetPromptListPage(page.presetId, page.sessionKey))}
      />
    </PresetStackPage>
  );
}

async function downloadPreset(presetId: string) {
  const blob = await exportPreset(presetId);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `preset-${presetId}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
