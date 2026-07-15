import { ModelProviderCreatePage } from './model-provider-create-page';
import { ModelProviderEditPage } from './model-provider-edit-page';
import { ModelProviderListPage } from './model-provider-list-page';
import { ModelProviderApiKeyManagementPage } from './model-provider-api-key-management-page';
import {
  createModelProviderPage,
  editModelProviderPage,
  modelProviderApiKeysPage,
  type ModelProviderPage,
} from './model-provider-pages';

export function ModelProviderPageRenderer({
  page,
  onRootBack,
  popPage,
  pushPage,
  replacePage,
}: {
  page: ModelProviderPage;
  onRootBack: () => void;
  popPage: () => void;
  pushPage: (page: ModelProviderPage) => void;
  replacePage: (page: ModelProviderPage) => void;
}) {
  if (page.name === 'list') {
    return (
      <ModelProviderListPage
        onBack={onRootBack}
        onCreate={() => pushPage(createModelProviderPage())}
        onManageApiKeys={() => pushPage(modelProviderApiKeysPage)}
        onSelectConfig={(configId) => pushPage(editModelProviderPage(configId))}
      />
    );
  }

  if (page.name === 'api-keys') {
    return <ModelProviderApiKeyManagementPage onBack={popPage} />;
  }

  if (page.name === 'create') {
    return (
      <ModelProviderCreatePage
        page={page}
        replacePage={replacePage}
        onBack={popPage}
        onManageApiKeys={() => pushPage(modelProviderApiKeysPage)}
      />
    );
  }

  if (page.name === 'edit') {
    return (
      <ModelProviderEditPage
        page={page}
        onBack={popPage}
        onManageApiKeys={() => pushPage(modelProviderApiKeysPage)}
      />
    );
  }

  return null;
}
