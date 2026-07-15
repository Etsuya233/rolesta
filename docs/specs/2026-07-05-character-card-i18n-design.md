# Character Card Internationalization Design

## Context

Rolesta already has a web internationalization layer based on `i18next` and `react-i18next`. The existing resources cover auth, chat workbench, common request errors, and API error messages. The character card manager was implemented after that baseline and still contains hard-coded user-visible Chinese text, plus a few English pagination aria labels.

The character card manager lives in `apps/web/src/features/characters`. It also uses shared asset-management UI components from `apps/web/src/features/assets/components`, including top bars, scope tabs, sorting controls, form sections, and pagination controls.

## Goals

- Internationalize all user-visible text in the character card module.
- Internationalize user-visible text in asset components used by the character card module.
- Keep support for `en-US`, `zh-CN`, `zh-TW`, and `ja-JP`.
- Keep the current UI behavior, layout, page stack, API calls, and API schema unchanged.
- Keep tests stable by fixing the test locale or using locale-aware assertions where appropriate.
- Add resource coverage checks so the four supported locales keep the same `assets` and `characters` key structure.

## Non-Goals

- Do not change backend character APIs.
- Do not change the existing locale detection, persistence, or `Accept-Language` request flow.
- Do not redesign the character card UI.
- Do not add a new translation storage format or runtime resource loader.

## Resource Structure

Translations stay in `apps/web/src/lib/i18n/resources.ts`.

Add two domain-oriented resource groups:

```ts
{
  assets: {
    navigation: {
      back: string;
    },
    scope: {
      all: string;
      mine: string;
      public: string;
    },
    sort: {
      fieldLabel: string;
      directionLabel: string;
      ascending: string;
      descending: string;
    },
    pagination: {
      pageSizeLabel: string;
      firstPage: string;
      previousPage: string;
      nextPage: string;
      lastPage: string;
    },
  },
  characters: {
    list: {
      title: string;
      importAction: string;
      createAction: string;
      searchLabel: string;
      searchPlaceholder: string;
      loading: string;
      loadFailed: string;
      empty: string;
      publicVisibility: string;
      privateVisibility: string;
      unused: string;
      usageCount: string;
      sort: {
        createdAt: string;
        updatedAt: string;
        name: string;
        lastUsedAt: string;
        usageCount: string;
      };
    };
    editor: {
      createTitle: string;
      editTitle: string;
      createSubmit: string;
      saveSubmit: string;
      mainEditorLabel: string;
      sections: {
        basic: { title: string; description: string };
        content: { title: string; description: string };
        prompts: { title: string; description: string };
        metadata: { title: string; description: string };
      };
      fields: {
        name: string;
        comment: string;
        tags: string;
        tagsDescription: string;
        version: string;
        visibility: string;
        description: string;
        firstMessage: string;
        alternateGreetings: string;
        personality: string;
        scenario: string;
        creatorNotes: string;
        messageExample: string;
        systemPrompt: string;
        postHistoryInstructions: string;
        creator: string;
        nickname: string;
      };
    };
    greetings: {
      title: string;
      sectionTitle: string;
      itemLabel: string;
      deleteAction: string;
      addAction: string;
    };
    import: {
      title: string;
      fileSectionTitle: string;
      chooseFile: string;
      fileRequired: string;
      failed: string;
      submit: string;
    };
  };
}
```

`characters.greetings.itemLabel`, `characters.greetings.deleteAction`, and `characters.list.usageCount` use interpolation parameters.

## Component Changes

Asset components read shared text directly with `useTranslation()`:

- `MobileTopBar`: translates the back button aria label.
- `AssetScopeTabs`: translates `all`, `mine`, and `public`.
- `AssetSortMenu`: translates sort aria labels and direction labels.
- `PageControls`: translates page-size and page navigation aria/text labels.

Character components read character-specific text directly with `useTranslation()`:

- Page components translate titles and action labels.
- `CharacterCardListPanel` translates search labels, search placeholder, sort options, and loading/error/empty states.
- `CharacterCardListItem` translates visibility labels and usage count text.
- `CharacterCardMainEditor` translates section titles, section descriptions, field labels, field descriptions, visibility options, action labels, and submit labels supplied by parent pages.
- `CharacterGreetingsPage` and `CharacterGreetingsEditor` translate the alternate greeting title, item labels, delete action, and add action.
- `CharacterImportPage` and `CharacterImportPanel` translate the page title, file section title, file picker prompt, local validation error, import error, and submit label.

No component receives a large label object through props. Business-specific option labels, such as character sort options, are translated at the component that owns the business meaning.

## Error Handling

The API error envelope remains unchanged.

Existing API-driven form error strings stay in the current data flow. This change only internationalizes component-owned strings such as:

- list loading and load failure text;
- import file-required validation text;
- import failure text;
- visible form/page labels and actions.

Missing translation keys are exposed by tests. No additional runtime fallback layer is added.

## Testing

Resource coverage tests:

- Keep the existing default API error message-key coverage.
- Add a recursive key-shape comparison for `assets` and `characters` across all supported locales.

Playwright tests:

- Set `localStorage["rolesta.locale"]` to `zh-CN` before navigating to `/app/characters`.
- Keep behavior assertions using Simplified Chinese labels.
- Update pagination assertions so previous/next labels use the translated Chinese text consistently.

Implementation verification:

- Run `rg` over `apps/web/src/features/characters` and the used `apps/web/src/features/assets/components` files to find remaining hard-coded Chinese or English UI text.
- Run targeted i18n and character tests.
- Run typecheck for the web app or full workspace if the project scripts require it.

## Acceptance Criteria

- Character card list, create, edit, greetings, and import pages render from i18n resources.
- Asset controls used by the character card module render from i18n resources.
- The four supported locales contain matching `assets` and `characters` resource keys.
- Existing character manager behavior remains unchanged.
- Character Playwright tests run with a fixed locale and pass with translated labels.
