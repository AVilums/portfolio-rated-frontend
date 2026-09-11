import { expect, test } from '@playwright/test';

test('sign in, save, refresh, edit and sign out', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'See how concentrated your portfolio really is.' }),
  ).toBeVisible();
  await page.getByRole('banner').getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.screenshot({ path: 'test-results/login-desktop.png', fullPage: true });
  await page.getByLabel('Email').fill(process.env.INITIAL_EMAIL ?? 'demo@example.com');
  await page
    .getByLabel('Password')
    .fill(process.env.INITIAL_PASSWORD ?? 'local-portfolio-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  const edit = page.getByRole('button', { name: 'Edit portfolio' });
  if (await edit.isVisible()) await edit.click();
  while ((await page.getByRole('button', { name: /^Remove position/ }).count()) > 1) {
    await page.getByRole('button', { name: 'Remove position 2', exact: true }).click();
  }
  await page.getByLabel('ETF ticker 1', { exact: true }).fill('QQQ');
  await page.getByLabel('Weight (%) 1', { exact: true }).fill('60');
  await page.getByLabel('Average price 1', { exact: true }).fill('500');
  await page.getByRole('button', { name: '+ Add position' }).click();
  await page.getByLabel('ETF ticker 2', { exact: true }).fill('VTI');
  await page.getByLabel('Weight (%) 2', { exact: true }).fill('40');
  await page.getByLabel('Average price 2', { exact: true }).fill('250');
  await page.getByRole('button', { name: 'Analyse portfolio' }).click();
  await expect(page.getByRole('heading', { name: 'Portfolio report' })).toBeVisible();
  await expect(page.getByText('52', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/report-desktop.png', fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Portfolio report' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit portfolio' }).click();
  await expect(page.getByLabel('Weight (%) 1', { exact: true })).toHaveValue('60');
  expect(pageErrors).toEqual([]);
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/portfolio-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'See how concentrated your portfolio really is.' }),
  ).toBeVisible();
});
