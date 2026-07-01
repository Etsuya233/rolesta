import { expect, test } from '@playwright/test';

test('renders the workbench shell', async ({ page }) => {
  await page.goto('/app');

  await expect(page.getByRole('heading', { name: 'Chat workbench' })).toBeVisible();
});
