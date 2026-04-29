import { expect, test } from '@playwright/test';
import { collectPageErrors } from '../helpers/assertions';
import { login } from '../helpers/auth';
import { selector } from '../helpers/env';
import { gotoUserDetailPage } from '../helpers/navigation';

test('GUNSQA-85 @GUNSQA-85 user certificate attachment preview should not crash on undefined router', async ({ page, context }) => {
  const errors = collectPageErrors(page);
  await login(page);
  await gotoUserDetailPage(page);

  await page.locator(selector('USER_DETAIL_OPEN_SELECTOR', 'button:has-text("详情"), a:has-text("详情")')).first().click();
  await page.locator(selector('CERT_TAB_SELECTOR', 'text=用户证书, [role="tab"]:has-text("用户证书")')).first().click();

  const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
  const beforeUrl = page.url();
  await page.locator(selector('CERT_ATTACHMENT_SELECTOR', 'a')).first().click();
  const popup = await popupPromise;

  expect(errors.some((item) => item.includes('router is not defined'))).toBeFalsy();

  const sameTabPreview = page.url() !== beforeUrl;
  const popupPreview = popup !== null;
  if (popup) {
    await popup.waitForLoadState('domcontentloaded');
  }
  expect(popupPreview || sameTabPreview).toBeTruthy();
  await context.close();
});
