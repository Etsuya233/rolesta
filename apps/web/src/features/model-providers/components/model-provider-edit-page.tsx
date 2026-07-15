import { Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { MobileTopBar } from '../../assets/components/mobile-top-bar';
import { deleteModelProvider, getModelProvider } from '../api/model-providers-api';
import { ModelProviderMainEditor } from './model-provider-main-editor';
import type { ModelProviderPage } from './model-provider-pages';
import { ModelProviderStackPage } from './model-provider-stack-page';
import { useCurrentUser } from '../../auth/hooks/use-current-user';
import { AssetDefaultButton } from '../../chat-preferences/components/asset-default-button';
import { assetDefaultsQueryKey } from '../../chat-preferences/hooks/use-asset-defaults';

export function ModelProviderEditPage({
  page,
  onBack,
  onManageApiKeys,
}: {
  page: Extract<ModelProviderPage, { name: 'edit' }>;
  onBack: () => void;
  onManageApiKeys: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const config = useQuery({
    queryKey: ['model-provider', page.configId],
    queryFn: () => getModelProvider(page.configId),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteModelProvider(page.configId),
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['model-providers'] }),
        queryClient.invalidateQueries({ queryKey: assetDefaultsQueryKey }),
      ]);
      onBack();
    },
  });

  return (
    <ModelProviderStackPage>
      <MobileTopBar
        actions={
          <>
            <AssetDefaultButton
              assetId={page.configId}
              currentUserId={currentUser.data?.user?.id}
              kind="modelProvider"
              ownerUserId={config.data?.ownerUserId}
            />
            <Button
              aria-label={t('modelProviders.editor.deleteAction')}
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
        title={t('modelProviders.editor.editTitle')}
        onBack={onBack}
      />
      <ModelProviderMainEditor
        configId={page.configId}
        sessionKey={page.sessionKey}
        submitLabel={t('modelProviders.editor.saveSubmit')}
        onManageApiKeys={onManageApiKeys}
      />
    </ModelProviderStackPage>
  );
}
