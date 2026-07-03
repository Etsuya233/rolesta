import { expect, test } from '@playwright/test';
import { mockAuthenticatedApp, mockCharacterList } from './api-mocks';

test('renders character manager controls', async ({ page }) => {
  await mockAuthenticatedApp(page);
  await mockCharacterList(page);

  await page.goto('/app/characters');

  await expect(page.getByRole('heading', { name: '角色卡' })).toBeVisible();
  await expect(page.getByLabel('搜索角色卡')).toBeVisible();
  await expect(page.getByText('«')).toBeVisible();
  await expect(page.getByText('‹')).toBeVisible();
  await expect(page.getByText('›')).toBeVisible();
  await expect(page.getByText('»')).toBeVisible();
});
