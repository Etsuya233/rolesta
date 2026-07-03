import { expect, test } from '@playwright/test';
import { mockAuthenticatedApp } from './api-mocks';

test('renders the workbench shell', async ({ page }) => {
  await mockAuthenticatedApp(page);

  await page.goto('/app');

  await expect(page.getByRole('heading', { name: 'Chat workbench' })).toBeVisible();
});
