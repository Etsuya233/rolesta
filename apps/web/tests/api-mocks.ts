import type { Page } from '@playwright/test';

export async function mockAuthenticatedApp(page: Page) {
  await page.route(/\/api\/auth\/setup-status$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 'SUCCESS',
        msg: 'ok',
        data: { requiresSetup: false },
      },
    });
  });

  await page.route(/\/api\/auth\/current-user$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 'SUCCESS',
        msg: 'ok',
        data: {
          user: {
            id: 'user_e2e',
            username: 'e2e',
            displayName: 'E2E',
            role: 'admin',
          },
        },
      },
    });
  });
}

export async function mockCharacterList(page: Page) {
  await page.route(/\/api\/characters(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        code: 'SUCCESS',
        msg: 'ok',
        data: {
          items: [
            {
              id: 'character_e2e',
              ownerUserId: 'user_e2e',
              visibility: 'private',
              name: 'Seraphina',
              tags: ['fantasy'],
              version: '1.0',
              comment: 'Forest guardian',
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
