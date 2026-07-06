import { ModelProviderApiKeysPage } from "./model-provider-api-keys-page";
import { ModelProviderCreatePage } from "./model-provider-create-page";
import { ModelProviderEditPage } from "./model-provider-edit-page";
import { ModelProviderListPage } from "./model-provider-list-page";
import {
  createModelProviderPage,
  editModelProviderPage,
  type ModelProviderPage,
} from "./model-provider-pages";

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
  if (page.name === "list") {
    return (
      <ModelProviderListPage
        onBack={onRootBack}
        onCreate={() => pushPage(createModelProviderPage())}
        onSelectConfig={(configId) => pushPage(editModelProviderPage(configId))}
      />
    );
  }

  if (page.name === "create") {
    return (
      <ModelProviderCreatePage
        page={page}
        replacePage={replacePage}
        onBack={popPage}
      />
    );
  }

  if (page.name === "edit") {
    return (
      <ModelProviderEditPage page={page} pushPage={pushPage} onBack={popPage} />
    );
  }

  return <ModelProviderApiKeysPage page={page} onBack={popPage} />;
}
