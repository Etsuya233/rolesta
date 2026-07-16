import { expect, test, type Page, type Route } from '@playwright/test';
import { mockAuthenticatedApp } from './api-mocks';

test('filters presets by permission from the search toolbar', async ({ page }) => {
  await mockAuthenticatedApp(page);
  await mockPresetList(page);
  await page.goto('/app/presets');

  const filterButton = page.getByRole('button', { name: 'Filter presets' });
  await filterButton.click();

  const publicRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname.endsWith('/presets') && url.searchParams.get('scope') === 'public';
  });

  await page.getByRole('radio', { name: 'Public', exact: true }).click();
  await publicRequest;
  await expect(filterButton).toHaveAttribute('aria-pressed', 'true');
});

test('reloads preset details after reopening the preset editor', async ({ page }) => {
  await mockAuthenticatedApp(page);
  await mockPresetList(page);
  await page.route(/^https?:\/\/[^/]+\/(?:api\/)?presets\/preset_e2e$/, async (route) => {
    await fulfillPresetDetail(route);
  });

  await page.goto('/app/presets');
  await page.getByRole('button', { name: /Complete preset/ }).click();

  const nameInput = page.getByRole('textbox', { name: 'Name' });
  await expect(nameInput).toHaveValue('Complete preset');

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('heading', { name: 'Presets' })).toBeVisible();
  await page.getByRole('button', { name: /Complete preset/ }).click();

  await expect(nameInput).toHaveValue('Complete preset');
});

test('keeps prompt role and placement selected after reopening an entry', async ({ page }) => {
  await mockAuthenticatedApp(page);
  await mockPresetList(page);
  await page.route(/^https?:\/\/[^/]+\/(?:api\/)?presets\/preset_e2e$/, async (route) => {
    await fulfillPresetDetail(route);
  });

  await page.goto('/app/presets');
  await page.getByRole('button', { name: /Complete preset/ }).click();
  await page.getByRole('button', { name: 'Prompt list' }).click();
  await page.getByRole('button', { name: 'Edit entry' }).nth(1).click();

  const roleSelect = page.getByRole('combobox', { name: 'Role' });
  const placementSelect = page.getByRole('combobox', { name: 'Placement' });
  await expect(roleSelect).toHaveText('User');
  await expect(placementSelect).toHaveText('In chat');

  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Edit entry' }).nth(1).click();

  await expect(roleSelect).toHaveText('User');
  await expect(placementSelect).toHaveText('In chat');
});

test('marks only slot and system prompt items', async ({ page }) => {
  await mockAuthenticatedApp(page);
  await mockPresetList(page);
  await page.route(/^https?:\/\/[^/]+\/(?:api\/)?presets\/preset_e2e$/, async (route) => {
    await fulfillPresetDetail(route);
  });

  await page.goto('/app/presets');
  await page.getByRole('button', { name: /Complete preset/ }).click();
  await page.getByRole('button', { name: 'Prompt list' }).click();

  await expect(page.getByText('Slot', { exact: true })).toHaveCount(8);
  await expect(page.getByText('System', { exact: true })).toHaveCount(4);
  await expect(page.getByText('Custom', { exact: true })).toHaveCount(0);
});

test('opens an imported preset immediately when no import issues exist', async ({ page }) => {
  await mockAuthenticatedApp(page);
  await mockPresetList(page);
  await page.route(/^https?:\/\/[^/]+\/(?:api\/)?presets\/import$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 'SUCCESS',
        msg: 'ok',
        data: {
          preset: presetDetailData({ name: 'Imported preset' }),
          issues: [],
          supplementedItems: ['auxiliaryPrompt'],
        },
      },
    });
  });

  await page.goto('/app/presets');
  await page.getByRole('button', { name: 'Import preset' }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'imported-preset.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        name: 'Imported preset',
        prompts: [],
        prompt_order: [{ character_id: 100001, order: [] }],
      }),
    ),
  });
  await page.getByRole('button', { name: 'Confirm import' }).click();

  await expect(page.getByRole('heading', { name: 'Edit preset' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Imported preset');
  await expect(page.getByRole('button', { name: 'Continue to preset' })).toHaveCount(0);
});

test('restores the main system prompt defaults', async ({ page }) => {
  await mockAuthenticatedApp(page);
  await mockPresetList(page);
  await page.route(/^https?:\/\/[^/]+\/(?:api\/)?presets\/preset_e2e$/, async (route) => {
    await fulfillPresetDetail(route);
  });

  await page.goto('/app/presets');
  await page.getByRole('button', { name: /Complete preset/ }).click();
  await page.getByRole('button', { name: 'Prompt list' }).click();
  await page.getByRole('button', { name: 'Edit system item' }).first().click();

  await expect(page.getByRole('heading', { name: 'Edit system item' })).toBeVisible();

  const contentInput = page.getByRole('textbox', { name: 'Prompt' });
  const placementSelect = page.getByRole('combobox', { name: 'Placement' });
  const allowCharacterOverride = page.getByRole('checkbox', {
    name: 'Allow character card override',
  });

  await contentInput.fill('Changed main prompt');
  await placementSelect.click();
  await page.getByRole('option', { name: 'In chat' }).click();
  await allowCharacterOverride.uncheck();
  await page.getByRole('button', { name: 'Restore default' }).click();

  await expect(contentInput).toHaveValue(defaultMainPromptContent);
  await expect(placementSelect).toHaveText('Relative');
  await expect(allowCharacterOverride).toBeChecked();
});

test('saves one complete preset document across editor pages', async ({ page }) => {
  let savedDocument: Record<string, unknown> | null = null;

  await mockAuthenticatedApp(page);
  await mockPresetList(page);
  await page.route(/^https?:\/\/[^/]+\/(?:api\/)?presets\/preset_e2e$/, async (route) => {
    if (route.request().method() === 'PUT') {
      savedDocument = route.request().postDataJSON() as Record<string, unknown>;
      await fulfillPresetDetail(route, savedDocument);
      return;
    }

    await fulfillPresetDetail(route);
  });

  await page.goto('/app/presets');
  await page.getByRole('button', { name: /Complete preset/ }).click();
  await page.getByRole('button', { name: 'Prompt list' }).click();

  const savePromptList = page.getByRole('button', { name: 'Save' });
  await expect(savePromptList).toBeDisabled();

  const enabledToggles = page.getByRole('checkbox', { name: 'Enable entry' });
  await enabledToggles.first().uncheck();
  await expect(savePromptList).toBeEnabled();

  await page.getByRole('button', { name: 'Edit entry' }).nth(1).click();
  await page.getByRole('textbox', { name: 'Name' }).fill('Second updated');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('heading', { name: 'Edit Entry' })).toBeVisible();
  await expect(savePromptList).toBeDisabled();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('heading', { name: 'Prompt list' })).toBeVisible();
  await expect(enabledToggles.first()).not.toBeChecked();
  await expect
    .poll(
      () =>
        (savedDocument?.promptItems as Array<Record<string, unknown>> | undefined)?.find(
          (item) => item.id === 'main_item',
        )?.enabled,
    )
    .toBe(false);
  expect(savedDocument).toMatchObject({
    name: 'Complete preset',
    modelProviderId: 'provider_1',
    entries: [
      { id: 'entry_1', name: 'First' },
      { id: 'entry_2', name: 'Second updated' },
    ],
  });
});

test('updates and clears the preset model connection', async ({ page }) => {
  let savedDocument: Record<string, unknown> | null = null;

  await mockAuthenticatedApp(page);
  await mockPresetList(page);
  await page.route(/^https?:\/\/[^/]+\/(?:api\/)?presets\/preset_e2e$/, async (route) => {
    if (route.request().method() === 'PUT') {
      savedDocument = route.request().postDataJSON() as Record<string, unknown>;
      await fulfillPresetDetail(route, savedDocument);
      return;
    }

    await fulfillPresetDetail(route);
  });

  await page.goto('/app/presets');
  await page.getByRole('button', { name: /Complete preset/ }).click();

  const modelConnection = page.getByRole('combobox', {
    name: 'Model connection',
  });
  await expect(modelConnection).toContainText('Primary connection');
  await modelConnection.click();
  await page.getByRole('option', { name: /Secondary connection/ }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect.poll(() => savedDocument?.modelProviderId).toBe('provider_2');

  await page.getByRole('button', { name: 'Clear model connection' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect.poll(() => savedDocument?.modelProviderId).toBeNull();
});

async function mockPresetList(page: Page) {
  await page.route(/^https?:\/\/[^/]+\/(?:api\/)?model-providers(?:\?.*)?$/, async (route) => {
    const pageIndex = Number(new URL(route.request().url()).searchParams.get('pageIndex'));
    const providers =
      pageIndex === 0
        ? [modelProviderSummary('provider_1', 'Primary connection', 'model-a')]
        : [modelProviderSummary('provider_2', 'Secondary connection', 'model-b')];

    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 'SUCCESS',
        msg: 'ok',
        data: {
          items: providers,
          pageIndex,
          pageSize: 100,
          totalItems: 2,
          totalPages: 2,
        },
      },
    });
  });

  await page.route(/^https?:\/\/[^/]+\/(?:api\/)?presets(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 'SUCCESS',
        msg: 'ok',
        data: {
          items: [
            {
              id: 'preset_e2e',
              ownerUserId: 'user_e2e',
              visibility: 'private',
              name: 'Complete preset',
              entryCount: 2,
              promptItemCount: 14,
              tokenCount: 4,
              createdAtMs: 1783090000000,
              updatedAtMs: 1783090000000,
              lastUsedAtMs: null,
              usageCount: 0,
            },
          ],
          pageIndex: 0,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
        },
      },
    });
  });
}

async function fulfillPresetDetail(route: Route, document: Record<string, unknown> = {}) {
  await route.fulfill({
    contentType: 'application/json',
    json: {
      code: 'SUCCESS',
      msg: 'ok',
      data: presetDetailData(document),
    },
  });
}

function presetDetailData(document: Record<string, unknown> = {}) {
  const entries = (document.entries as Array<Record<string, unknown>> | undefined) ?? [
    {
      id: 'entry_1',
      name: 'First',
      role: 'system',
      placement: { kind: 'relative' },
      generationTypes: [],
      content: 'first content',
    },
    {
      id: 'entry_2',
      name: 'Second',
      role: 'user',
      placement: { kind: 'inChat', depth: 4, order: 100 },
      generationTypes: ['normal'],
      content: 'second content',
    },
  ];
  const promptItems = (document.promptItems as Array<Record<string, unknown>> | undefined) ?? [
    ...defaultPromptItems(),
    {
      id: 'custom_item_1',
      kind: 'customPrompt',
      entryId: 'entry_1',
      enabled: true,
    },
    {
      id: 'custom_item_2',
      kind: 'customPrompt',
      entryId: 'entry_2',
      enabled: true,
    },
  ];

  return {
    id: 'preset_e2e',
    ownerUserId: 'user_e2e',
    visibility: document.visibility ?? 'private',
    name: document.name ?? 'Complete preset',
    entryCount: entries.length,
    promptItemCount: promptItems.length,
    tokenCount: 4,
    createdAtMs: 1783090000000,
    updatedAtMs: 1783090001000,
    lastUsedAtMs: null,
    usageCount: 0,
    modelProviderId: Object.hasOwn(document, 'modelProviderId')
      ? document.modelProviderId
      : 'provider_1',
    modelSettings: document.modelSettings ?? defaultModelSettings,
    tokenizer: 'cl100k_base',
    sourceFormat: 'rolesta',
    entries: entries.map((entry, index) => ({
      presetId: 'preset_e2e',
      identifier: entry.id,
      tokenCount: 2,
      metadata: {},
      createdAtMs: 1783090000000 + index,
      updatedAtMs: 1783090001000,
      ...entry,
    })),
    promptItems: promptItems.map((item, orderIndex) => ({
      orderIndex,
      ...item,
    })),
  };
}

function defaultPromptItems(): Array<Record<string, unknown>> {
  return [
    {
      id: 'main_item',
      kind: 'systemPrompt',
      systemPrompt: 'mainPrompt',
      name: 'Main Prompt',
      role: 'system',
      content: defaultMainPromptContent,
      placement: { kind: 'relative' },
      generationTypes: [],
      allowCharacterOverride: true,
      tokenCount: 20,
      enabled: true,
    },
    contentSlot('world_info_before_item', 'worldInfoBefore'),
    contentSlot('persona_description_item', 'personaDescription'),
    contentSlot('character_description_item', 'characterDescription'),
    contentSlot('character_personality_item', 'characterPersonality'),
    contentSlot('scenario_item', 'scenario'),
    {
      id: 'enhance_definitions_item',
      kind: 'systemPrompt',
      systemPrompt: 'enhanceDefinitions',
      name: 'Enhance Definitions',
      role: 'system',
      content:
        "If you have more knowledge of {{char}}, add to the character's lore and personality to enhance them but keep the Character Sheet's definitions absolute.",
      placement: { kind: 'relative' },
      generationTypes: [],
      tokenCount: 27,
      enabled: false,
    },
    {
      id: 'auxiliary_prompt_item',
      kind: 'systemPrompt',
      systemPrompt: 'auxiliaryPrompt',
      name: 'Auxiliary Prompt',
      role: 'system',
      content: '',
      placement: { kind: 'relative' },
      generationTypes: [],
      tokenCount: 0,
      enabled: true,
    },
    contentSlot('world_info_after_item', 'worldInfoAfter'),
    {
      id: 'dialogue_examples_item',
      kind: 'slot',
      slot: 'dialogueExamples',
      enabled: true,
    },
    {
      id: 'chat_history_item',
      kind: 'slot',
      slot: 'chatHistory',
      enabled: true,
    },
    {
      id: 'post_history_instructions_item',
      kind: 'systemPrompt',
      systemPrompt: 'postHistoryInstructions',
      name: 'Post-History Instructions',
      role: 'system',
      content: '',
      placement: { kind: 'relative' },
      generationTypes: [],
      allowCharacterOverride: true,
      tokenCount: 0,
      enabled: true,
    },
  ];
}

function contentSlot(id: string, slot: string): Record<string, unknown> {
  return {
    id,
    kind: 'slot',
    slot,
    role: 'system',
    placement: { kind: 'relative' },
    generationTypes: [],
    enabled: true,
  };
}

function modelProviderSummary(id: string, name: string, defaultModelName: string) {
  return {
    id,
    ownerUserId: 'user_e2e',
    name,
    providerKind: 'openai-compatible',
    providerSource: 'custom',
    baseUrl: 'https://example.com/v1',
    defaultModelName,
    credentialMode: 'manual',
    apiKeyId: null,
    apiKeyName: null,
    createdAtMs: 1783090000000,
    updatedAtMs: 1783090000000,
    lastUsedAtMs: null,
    usageCount: 0,
  };
}

const defaultModelSettings = {
  contextLength: null,
  maxResponseLength: null,
  stream: true,
  temperature: null,
  presencePenalty: null,
  frequencyPenalty: null,
  repetitionPenalty: null,
  topP: null,
  topK: null,
  minP: null,
  topA: null,
  seed: null,
  n: null,
  reasoningEffort: '',
  verbosity: '',
  showThoughts: false,
};

const defaultMainPromptContent =
  "Write {{char}}'s next reply in a fictional chat between {{charIfNotGroup}} and {{user}}.";
