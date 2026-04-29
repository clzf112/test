import { expect, test } from '@playwright/test';
import { collectRequests } from '../helpers/assertions';
import { login } from '../helpers/auth';
import { selector } from '../helpers/env';
import { gotoFilePage } from '../helpers/navigation';

test('GUNSQA-87 @GUNSQA-87 download flow should not expose token in the URL', async ({ page }) => {
  const requests = collectRequests(page);
  await login(page);
  await gotoFilePage(page);

  const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
  await page.locator(selector('FILE_DOWNLOAD_SELECTOR', 'button:has-text("下载"), a:has-text("下载")')).first().click();
  const popup = await popupPromise;
  await page.waitForTimeout(1500);

  const urls = requests.map((request) => request.url());
  if (popup) {
    urls.push(popup.url());
  }

  expect(urls.some((url) => /[?&]token=/.test(url))).toBeFalsy();
});
