import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import { mockAuthenticatedApp } from './api-mocks';

test('filters worldbooks by permission from the search toolbar', async ({ page }) => {
  await mockAuthenticatedApp(page);
  await mockWorldbookList(page);
  await page.goto('/app/worldbooks');

  const filterButton = page.getByRole('button', {
    name: 'Filter worldbooks',
  });
  await filterButton.click();

  const publicRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname.endsWith('/api/worldbooks') && url.searchParams.get('scope') === 'public';
  });

  await page.getByRole('radio', { name: 'Public', exact: true }).click();
  await publicRequest;
  await expect(filterButton).toHaveAttribute('aria-pressed', 'true');
});

test('keeps public visibility selected after reopening the worldbook editor', async ({ page }) => {
  await mockAuthenticatedApp(page);
  await mockWorldbookList(page);
  await page.route(/\/api\/worldbooks\/worldbook_e2e$/, async (route) => {
    await fulfillWorldbookDetail(route, { visibility: 'public' });
  });

  await page.goto('/app/worldbooks');
  await page.getByRole('button', { name: /Complete worldbook/ }).click();

  const visibilitySelect = page.getByRole('combobox', { name: 'Visibility' });
  await expect(visibilitySelect).toHaveText('Public');

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('heading', { name: 'Worldbooks' })).toBeVisible();
  await page.getByRole('button', { name: /Complete worldbook/ }).click();

  await expect(visibilitySelect).toHaveText('Public');
});

test('loads and saves user-level worldbook scan preferences', async ({ page }) => {
  let savedPreferences: Record<string, unknown> | null = null;
  const preferences = worldbookScanPreferences();

  await mockAuthenticatedApp(page);
  await mockWorldbookList(page);
  await page.route(/\/api\/worldbooks\/scan-preferences$/, async (route) => {
    if (route.request().method() === 'PUT') {
      savedPreferences = route.request().postDataJSON() as Record<string, unknown>;
    }

    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 'SUCCESS',
        msg: 'ok',
        data: savedPreferences ?? preferences,
      },
    });
  });

  await page.goto('/app/worldbooks');
  await page.getByRole('button', { name: 'Worldbook scan settings' }).click();
  await expect(page.getByText('Worldbook scan preferences', { exact: true })).toBeVisible();

  await page.getByRole('spinbutton', { name: 'Scan depth' }).fill('6');
  await page.getByRole('checkbox', { name: 'Recursive scan' }).check();
  await page.getByRole('button', { name: 'Save preferences' }).click();

  await expect
    .poll(() => savedPreferences)
    .toMatchObject({
      scanDepth: 6,
      budgetPercent: 25,
      recursive: true,
      characterLoreInsertionStrategy: 'characterFirst',
    });
});

test('edits insertion priority without changing display order', async ({ page }) => {
  let savedDocument: Record<string, unknown> | null = null;

  await mockAuthenticatedApp(page);
  await mockWorldbookList(page);
  await page.route(/\/api\/worldbooks\/worldbook_e2e$/, async (route) => {
    if (route.request().method() === 'PUT') {
      savedDocument = route.request().postDataJSON() as Record<string, unknown>;
      await fulfillWorldbookDetail(route, savedDocument);
      return;
    }

    await fulfillWorldbookDetail(route);
  });

  await page.goto('/app/worldbooks');
  await page.getByRole('button', { name: /Complete worldbook/ }).click();
  await page.getByRole('button', { name: 'Entries', exact: true }).click();
  await page.getByText('First', { exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Order' }).fill('999');
  await page.getByTestId('worldbook-floating-save').click();

  await expect.poll(() => savedDocument).toMatchObject({
    entries: [
      { id: 'entry_1', insertionOrder: 999 },
      { id: 'entry_2', insertionOrder: 100 },
    ],
  });
});

test('keeps worldbook entry changes in one draft until save', async ({ page }) => {
  let savedDocument: Record<string, unknown> | null = null;
  let updateRequestCount = 0;

  await mockAuthenticatedApp(page);
  await mockWorldbookList(page);
  await page.route(/\/api\/worldbooks\/worldbook_e2e$/, async (route) => {
    if (route.request().method() === 'PUT') {
      updateRequestCount += 1;
      savedDocument = route.request().postDataJSON() as Record<string, unknown>;
      await fulfillWorldbookDetail(route, savedDocument);
      return;
    }

    await fulfillWorldbookDetail(route);
  });

  await page.goto('/app/worldbooks');
  await page.getByRole('button', { name: /Complete worldbook/ }).click();
  const floatingSave = page.getByTestId('worldbook-floating-save');
  await expect(floatingSave).toHaveCount(1);
  await expect(floatingSave).toHaveText('Save preset');
  await page.getByRole('button', { name: 'Entries', exact: true }).click();

  const saveEntries = floatingSave;
  await expect(saveEntries).toBeDisabled();

  await page.getByText('Second', { exact: true }).click();
  const saveEntry = floatingSave;
  await expect(page.getByRole('button', { name: 'Delete entry' })).toBeVisible();
  await expect(saveEntry).toBeDisabled();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Second updated');
  await expect(saveEntry).toBeEnabled();
  await page.getByRole('button', { name: 'Back' }).click();

  await expect(page.getByRole('heading', { name: 'Entries' })).toBeVisible();
  await expect(page.getByText('Second updated', { exact: true })).toBeVisible();
  await expect(saveEntries).toBeEnabled();

  const enabledToggles = page.getByRole('checkbox', { name: 'Enable entry' });
  await enabledToggles.first().uncheck();
  await page.getByRole('button', { name: 'Blue trigger', exact: true }).first().click();
  await expect.poll(() => updateRequestCount).toBe(0);

  await expect(enabledToggles.first()).not.toBeChecked();
  await expect(saveEntries).toBeEnabled();

  await page.getByText('Second updated', { exact: true }).click();
  await saveEntry.click();

  await expect(page.getByRole('heading', { name: 'Edit entry' })).toBeVisible();
  await expect(saveEntry).toBeDisabled();
  await expect
    .poll(() => savedDocument)
    .toMatchObject({
      name: 'Complete worldbook',
      visibility: 'private',
      entries: [
        {
          id: 'entry_1',
          name: 'First',
          enabled: false,
          constant: true,
        },
        {
          id: 'entry_2',
          name: 'Second updated',
          enabled: true,
          vectorized: true,
          automationId: 'quick-reply-2',
          addMemo: true,
        },
      ],
    });
  await expect.poll(() => updateRequestCount).toBe(1);

  await page.setViewportSize({ width: 390, height: 844 });
  const lastEntryControl = page.getByRole('spinbutton', {
    name: 'Delay until recursion',
  });
  await lastEntryControl.scrollIntoViewIfNeeded();
  await expectElementAbove(lastEntryControl, floatingSave);

  const floatingSaveBox = await floatingSave.boundingBox();
  expect(floatingSaveBox).not.toBeNull();
  expect(floatingSaveBox!.x + floatingSaveBox!.width).toBeLessThanOrEqual(374);
  expect(floatingSaveBox!.y + floatingSaveBox!.height).toBeLessThanOrEqual(828);
});

async function expectElementAbove(element: Locator, floatingAction: Locator) {
  const [elementBox, floatingActionBox] = await Promise.all([
    element.boundingBox(),
    floatingAction.boundingBox(),
  ]);

  expect(elementBox).not.toBeNull();
  expect(floatingActionBox).not.toBeNull();
  expect(elementBox!.y + elementBox!.height).toBeLessThanOrEqual(floatingActionBox!.y);
}

async function mockWorldbookList(page: Page) {
  await page.route(/\/api\/worldbooks(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 'SUCCESS',
        msg: 'ok',
        data: {
          items: [
            {
              id: 'worldbook_e2e',
              ownerUserId: 'user_e2e',
              visibility: 'private',
              name: 'Complete worldbook',
              description: '',
              tags: [],
              entryCount: 2,
              enabledEntryCount: 2,
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

async function fulfillWorldbookDetail(route: Route, document: Record<string, unknown> = {}) {
  const entries = (document.entries as Array<Record<string, unknown>> | undefined) ?? [
    worldbookEntry('entry_1', 'First'),
    worldbookEntry('entry_2', 'Second', {
      vectorized: true,
      automationId: 'quick-reply-2',
      addMemo: true,
    }),
  ];

  await route.fulfill({
    contentType: 'application/json',
    json: {
      code: 'SUCCESS',
      msg: 'ok',
      data: {
        id: 'worldbook_e2e',
        ownerUserId: 'user_e2e',
        visibility: document.visibility ?? 'private',
        name: document.name ?? 'Complete worldbook',
        description: document.description ?? '',
        tags: document.tags ?? [],
        entryCount: entries.length,
        enabledEntryCount: entries.filter((entry) => entry.enabled).length,
        tokenCount: 4,
        sourceFormat: 'rolesta',
        createdAtMs: 1783090000000,
        updatedAtMs: 1783090001000,
        lastUsedAtMs: null,
        usageCount: 0,
        entries: entries.map((entry, displayIndex) => ({
          worldbookId: 'worldbook_e2e',
          insertionOrder: 100,
          displayIndex,
          tokenCount: 2,
          createdAtMs: 1783090000000 + displayIndex,
          updatedAtMs: 1783090001000,
          ...entry,
        })),
      },
    },
  });
}

function worldbookEntry(id: string, name: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    enabled: true,
    name,
    comment: '',
    content: `${name.toLowerCase()} content`,
    primaryKeys: [],
    secondaryKeys: [],
    selective: false,
    selectiveLogic: 'andAny',
    constant: false,
    vectorized: false,
    ignoreBudget: false,
    useProbability: true,
    caseSensitive: null,
    matchWholeWords: null,
    matchPersonaDescription: false,
    matchCharacterDescription: false,
    matchCharacterPersonality: false,
    matchCharacterDepthPrompt: false,
    matchScenario: false,
    matchCreatorNotes: false,
    insertionPosition: 'beforeCharacterDefinition',
    depth: 3,
    insertionRole: 'system',
    anchorName: '',
    scanDepth: null,
    excludeRecursion: false,
    preventRecursion: false,
    delayUntilRecursion: 0,
    group: '',
    groupOverride: false,
    groupWeight: 100,
    useGroupScoring: null,
    sticky: null,
    cooldown: null,
    delay: null,
    characterFilterNames: [],
    characterFilterTags: [],
    characterFilterExclude: false,
    triggers: [],
    automationId: '',
    addMemo: false,
    probability: 100,
    ...overrides,
  };
}

function worldbookScanPreferences() {
  return {
    scanDepth: 2,
    minActivations: 0,
    minActivationsDepthMax: 0,
    budgetPercent: 25,
    budgetCap: 0,
    recursive: false,
    caseSensitive: false,
    matchWholeWords: false,
    useGroupScoring: false,
    maxRecursionSteps: 0,
    includeNames: true,
    characterLoreInsertionStrategy: 'characterFirst',
  };
}
