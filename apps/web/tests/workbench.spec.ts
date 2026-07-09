import { expect, test } from '@playwright/test';
import { mockAuthenticatedApp } from './api-mocks';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('rolesta.locale', 'en-US');

    if (!window.sessionStorage.getItem('rolesta.workspace.e2e.ready')) {
      window.localStorage.removeItem('rolesta.workspace.layout.v1');
      window.sessionStorage.setItem('rolesta.workspace.e2e.ready', 'true');
    }
  });
  await mockAuthenticatedApp(page);
  await mockWorkspaceAssetLists(page);
});

test('renders the workbench shell', async ({ page }) => {
  await openWorkbench(page);

  await expect(page.getByRole('heading', { name: 'Chat workbench' })).toBeVisible();
  await expect(page.getByTestId('workspace-left-column')).toBeVisible();
  await expect(page.getByTestId('workspace-bottom-slot')).toBeAttached();
});

test('generates toolbar buttons from the workspace panel registry', async ({
  page,
}) => {
  await openWorkbench(page);

  await expect(toolbarButton(page, 'chatContext')).toBeVisible();
  await expect(toolbarButton(page, 'recentWorkspace')).toBeVisible();
  await expect(toolbarButton(page, 'worldbooks')).toBeVisible();
  await expect(toolbarButton(page, 'characters')).toBeVisible();
  await expect(toolbarButton(page, 'presets')).toBeVisible();
  await expect(toolbarButton(page, 'modelProviders')).toBeVisible();
});

test('toolbar buttons do not create vertical overflow while pressed', async ({
  page,
}) => {
  await openWorkbench(page);

  const toggleLeftButton = page.getByRole('button', {
    name: 'Toggle left sidebar',
  });
  const buttonBox = await toggleLeftButton.boundingBox();
  expect(buttonBox).not.toBeNull();

  await page.mouse.move(
    buttonBox!.x + buttonBox!.width / 2,
    buttonBox!.y + buttonBox!.height / 2,
  );
  await page.mouse.down();

  const toolbarOverflow = await page
    .getByTestId('workspace-toolbar')
    .evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));

  await page.mouse.up();

  expect(toolbarOverflow.scrollHeight).toBe(toolbarOverflow.clientHeight);
});

test('toolbar hides panel labels below the desktop breakpoint', async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await openWorkbench(page);

  await expect(toolbarButton(page, 'worldbooks').locator('span')).toBeHidden();

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(toolbarButton(page, 'worldbooks').locator('span')).toBeVisible();
});

test('clicking Worldbooks activates the right panel', async ({ page }) => {
  await openWorkbench(page);

  await toolbarButton(page, 'worldbooks').click();

  await expect(page.getByTestId('workspace-panel-right-worldbooks')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Worldbooks' })).toBeVisible();
});

test('active toolbar panel buttons close their visible panel', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openWorkbench(page);

  await expect(toolbarButton(page, 'chatContext')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await toolbarButton(page, 'chatContext').click();
  await expect(page.getByTestId('workspace-left-column')).toBeHidden();
  await expect(toolbarButton(page, 'chatContext')).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  await toolbarButton(page, 'chatContext').click();
  await expect(page.getByTestId('workspace-left-column')).toBeVisible();
  await expect(toolbarButton(page, 'chatContext')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await toolbarButton(page, 'worldbooks').click();
  await expect(page.getByTestId('workspace-right-column')).toBeVisible();
  await expect(toolbarButton(page, 'worldbooks')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await toolbarButton(page, 'worldbooks').click();
  await expect(page.getByTestId('workspace-right-column')).toBeHidden();
  await expect(toolbarButton(page, 'worldbooks')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('toolbar panel buttons are inactive when their area is hidden', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openWorkbench(page);

  await toolbarButton(page, 'worldbooks').click();
  await expect(toolbarButton(page, 'worldbooks')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('button', { name: 'Toggle right sidebar' }).click();
  await expect(page.getByTestId('workspace-right-column')).toBeHidden();
  await expect(toolbarButton(page, 'worldbooks')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('switching away from a right panel keeps it mounted', async ({ page }) => {
  await openWorkbench(page);

  await toolbarButton(page, 'worldbooks').click();
  await expect(page.getByTestId('workspace-panel-right-worldbooks')).toBeVisible();

  await toolbarButton(page, 'characters').click();
  await expect(page.getByTestId('workspace-panel-right-characters')).toBeVisible();
  await expect(page.getByTestId('workspace-panel-right-worldbooks')).toBeAttached();
  await expect(page.getByTestId('workspace-panel-right-worldbooks')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  await expect(page.getByTestId('workspace-panel-right-worldbooks')).toHaveAttribute(
    'inert',
    '',
  );

  await toolbarButton(page, 'worldbooks').click();
  await expect(page.getByTestId('workspace-panel-right-worldbooks')).toBeVisible();
});

test('inactive right panels do not intercept visible panel clicks', async ({
  page,
}) => {
  await openWorkbench(page);

  await toolbarButton(page, 'worldbooks').click();
  await expect(page.getByTestId('workspace-panel-right-worldbooks')).toBeVisible();

  await toolbarButton(page, 'presets').click();
  await expect(page.getByTestId('workspace-panel-right-presets')).toBeVisible();
  const createPresetButton = page.getByRole('button', { name: 'New preset' });
  const createPresetBox = await createPresetButton.boundingBox();
  expect(createPresetBox).not.toBeNull();

  await page.mouse.click(
    createPresetBox!.x + createPresetBox!.width / 2,
    createPresetBox!.y + createPresetBox!.height / 2,
  );

  await expect(page.getByRole('heading', { name: 'New preset' })).toBeVisible();

  await toolbarButton(page, 'worldbooks').click();
  await expect(
    page
      .getByTestId('workspace-panel-right-worldbooks')
      .getByRole('heading', { name: 'Worldbooks' }),
  ).toBeVisible();
  await expect(
    page
      .getByTestId('workspace-panel-right-worldbooks')
      .getByRole('heading', { name: 'New worldbook' }),
  ).toHaveCount(0);
});

test('switching right panels preserves list scroll position', async ({ page }) => {
  await mockScrollableWorldbooks(page);
  await openWorkbench(page);

  await toolbarButton(page, 'worldbooks').click();
  await expect(page.getByRole('button', { name: /Scroll worldbook 40/ })).toBeVisible();
  const worldbookList = page
    .getByTestId('workspace-panel-right-worldbooks')
    .locator('.overflow-y-auto')
    .first();

  await worldbookList.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const scrollTopBefore = await worldbookList.evaluate(
    (element) => element.scrollTop,
  );
  expect(scrollTopBefore).toBeGreaterThan(0);

  await toolbarButton(page, 'presets').click();
  await expect(page.getByTestId('workspace-panel-right-presets')).toBeVisible();
  await toolbarButton(page, 'worldbooks').click();
  await expect(page.getByTestId('workspace-panel-right-worldbooks')).toBeVisible();

  await expect
    .poll(() => worldbookList.evaluate((element) => element.scrollTop))
    .toBe(scrollTopBefore);
});

test('switching viewport keeps side panel content mounted', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openWorkbench(page);

  const leftPanel = page.getByTestId('workspace-panel-left-chatContext');
  await expect(leftPanel).toBeVisible();
  await leftPanel.evaluate((element) => {
    element.setAttribute('data-persist-marker', 'left');
  });

  await toolbarButton(page, 'worldbooks').click();
  const rightPanel = page.getByTestId('workspace-panel-right-worldbooks');
  await expect(rightPanel).toBeVisible();
  await rightPanel.evaluate((element) => {
    element.setAttribute('data-persist-marker', 'right');
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Toggle left sidebar' }).click();

  await expect(leftPanel).toHaveAttribute('data-persist-marker', 'left');
  await expect(rightPanel).toHaveAttribute('data-persist-marker', 'right');
});

test('refresh restores active panels by area', async ({ page }) => {
  await openWorkbench(page);

  await toolbarButton(page, 'worldbooks').click();
  await expect(page.getByTestId('workspace-panel-right-worldbooks')).toBeVisible();

  await page.reload();

  await expect(page.getByTestId('workspace-panel-right-worldbooks')).toBeVisible();
});

test('desktop left and right toggles collapse and expand columns', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openWorkbench(page);

  await expect(page.getByTestId('workspace-left-column')).toBeVisible();
  await expect(page.getByTestId('workspace-right-column')).toBeVisible();

  await page.getByRole('button', { name: 'Toggle left sidebar' }).click();
  await expect(page.getByTestId('workspace-left-column')).toBeHidden();
  await expect(page.getByTestId('workspace-center-column')).toBeVisible();
  const centerBox = await page.getByTestId('workspace-center-column').boundingBox();
  expect(centerBox).not.toBeNull();
  expect(centerBox?.width).toBeGreaterThan(700);

  await page.getByRole('button', { name: 'Toggle left sidebar' }).click();
  await expect(page.getByTestId('workspace-left-column')).toBeVisible();

  await page.getByRole('button', { name: 'Toggle right sidebar' }).click();
  await expect(page.getByTestId('workspace-right-column')).toBeHidden();
  await page.getByRole('button', { name: 'Toggle right sidebar' }).click();
  await expect(page.getByTestId('workspace-right-column')).toBeVisible();
});

test('desktop side panels resize horizontally and persist widths', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await openWorkbench(page);

  const leftColumn = page.getByTestId('workspace-left-column');
  const rightColumn = page.getByTestId('workspace-right-column');
  const leftHandle = page.getByTestId('workspace-left-resize-handle');
  const rightHandle = page.getByTestId('workspace-right-resize-handle');

  const leftStartBox = await leftColumn.boundingBox();
  const leftHandleBox = await leftHandle.boundingBox();
  expect(leftStartBox).not.toBeNull();
  expect(leftHandleBox).not.toBeNull();

  await page.mouse.move(
    leftHandleBox!.x + leftHandleBox!.width / 2,
    leftHandleBox!.y + leftHandleBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(leftHandleBox!.x + 96, leftHandleBox!.y + 20);
  await page.mouse.up();

  const leftResizedBox = await leftColumn.boundingBox();
  expect(leftResizedBox).not.toBeNull();
  expect(leftResizedBox!.width).toBeGreaterThan(leftStartBox!.width);

  const rightHandleBox = await rightHandle.boundingBox();
  expect(rightHandleBox).not.toBeNull();

  await page.mouse.move(
    rightHandleBox!.x + rightHandleBox!.width / 2,
    rightHandleBox!.y + rightHandleBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(rightHandleBox!.x - 600, rightHandleBox!.y + 20);
  await page.mouse.up();

  const rightMaxBox = await rightColumn.boundingBox();
  expect(rightMaxBox).not.toBeNull();
  expect(rightMaxBox!.width).toBeCloseTo(640, 0);

  const rightMaxHandleBox = await rightHandle.boundingBox();
  expect(rightMaxHandleBox).not.toBeNull();
  await page.mouse.move(
    rightMaxHandleBox!.x + rightMaxHandleBox!.width / 2,
    rightMaxHandleBox!.y + rightMaxHandleBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(rightMaxHandleBox!.x + 600, rightMaxHandleBox!.y + 20);
  await page.mouse.up();

  const rightMinBox = await rightColumn.boundingBox();
  expect(rightMinBox).not.toBeNull();
  expect(rightMinBox!.width).toBeCloseTo(320, 0);

  await page.reload();

  const leftReloadedBox = await leftColumn.boundingBox();
  const rightReloadedBox = await rightColumn.boundingBox();
  expect(leftReloadedBox).not.toBeNull();
  expect(rightReloadedBox).not.toBeNull();
  expect(leftReloadedBox!.width).toBeCloseTo(leftResizedBox!.width, 0);
  expect(rightReloadedBox!.width).toBeCloseTo(320, 0);
});

test('mobile side panels do not show resize handles', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWorkbench(page);

  await expect(page.getByTestId('workspace-left-resize-handle')).toBeHidden();
  await expect(page.getByTestId('workspace-right-resize-handle')).toBeHidden();
});

test('mobile left and right toggles open sheets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWorkbench(page);

  await page.getByRole('button', { name: 'Toggle left sidebar' }).click();
  await expect(page.getByTestId('workspace-left-column')).toBeVisible();
  await expect(page.getByTestId('workspace-left-column')).toHaveAttribute(
    'data-mobile-open',
    'true',
  );
  await page.getByRole('button', { name: 'Toggle left sidebar' }).click();
  await expect(page.getByTestId('workspace-left-column')).toBeHidden();

  await page.getByRole('button', { name: 'Toggle right sidebar' }).click();
  await expect(page.getByTestId('workspace-right-column')).toBeVisible();
  await expect(page.getByTestId('workspace-right-column')).toHaveAttribute(
    'data-mobile-open',
    'true',
  );
});

test('mobile panel buttons open the target sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWorkbench(page);

  await toolbarButton(page, 'worldbooks').click();

  await expect(page.getByTestId('workspace-right-column')).toBeVisible();
  await expect(page.getByTestId('workspace-right-column')).toHaveAttribute(
    'data-mobile-open',
    'true',
  );
  await expect(
    page.getByTestId('workspace-right-column').getByRole('heading', {
      name: 'Worldbooks',
    }),
  ).toBeVisible();
});

test('mobile right panel stays below the toolbar and uses viewport width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWorkbench(page);

  await toolbarButton(page, 'worldbooks').click();

  const toolbarBox = await page.getByTestId('workspace-toolbar').boundingBox();
  const rightColumnBox = await page
    .getByTestId('workspace-right-column')
    .boundingBox();
  expect(toolbarBox).not.toBeNull();
  expect(rightColumnBox).not.toBeNull();
  expect(rightColumnBox?.y).toBe(toolbarBox!.height);
  expect(rightColumnBox?.width).toBeCloseTo(390, 1);

  await page.getByRole('button', { name: 'Toggle right sidebar' }).click();
  await expect(page.getByTestId('workspace-right-column')).toBeHidden();
});

async function mockWorkspaceAssetLists(page: Parameters<typeof mockAuthenticatedApp>[0]) {
  const emptyPage = {
    items: [],
    pageIndex: 0,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
  };

  await page.route(/\/api\/worldbooks(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: { code: 'SUCCESS', msg: 'ok', data: emptyPage },
    });
  });

  await page.route(/\/api\/characters(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: { code: 'SUCCESS', msg: 'ok', data: emptyPage },
    });
  });

  await page.route(/\/api\/presets(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: { code: 'SUCCESS', msg: 'ok', data: emptyPage },
    });
  });

  await page.route(/\/api\/model-providers(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: { code: 'SUCCESS', msg: 'ok', data: emptyPage },
    });
  });
}

async function mockScrollableWorldbooks(
  page: Parameters<typeof mockAuthenticatedApp>[0],
) {
  await page.route(/\/api\/worldbooks(?:\?.*)?$/, async (route) => {
    const items = Array.from({ length: 40 }, (_, index) => ({
      id: `worldbook_scroll_${index}`,
      ownerUserId: 'user_e2e',
      visibility: 'private',
      name: `Scroll worldbook ${index + 1}`,
      description: `Scrollable worldbook row ${index + 1}`,
      entryCount: index + 1,
      enabledEntryCount: index,
      tokenCount: 100 + index,
      createdAtMs: 1783090000000 + index,
      updatedAtMs: 1783090000000 + index,
      lastUsedAtMs: null,
      usageCount: index,
    }));

    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 'SUCCESS',
        msg: 'ok',
        data: {
          items,
          pageIndex: 0,
          pageSize: 40,
          totalItems: 40,
          totalPages: 1,
        },
      },
    });
  });
}

function toolbarButton(
  page: Parameters<typeof mockAuthenticatedApp>[0],
  panelKey:
    | 'chatContext'
    | 'recentWorkspace'
    | 'worldbooks'
    | 'characters'
    | 'presets'
    | 'modelProviders',
) {
  return page.getByTestId(`workspace-toolbar-panel-${panelKey}`);
}

async function openWorkbench(page: Parameters<typeof mockAuthenticatedApp>[0]) {
  await page.goto('/app');
  await expect(page.getByTestId('workspace-toolbar-panels')).toBeVisible({
    timeout: 15_000,
  });
}
