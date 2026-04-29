import { expect, test } from '@playwright/test';
import { collectPageErrors } from '../helpers/assertions';
import { login } from '../helpers/auth';
import { selector } from '../helpers/env';
import { gotoUserDetailPage } from '../helpers/navigation';

test('GUNSQA-85 @GUNSQA-85 user certificate attachment preview should not crash on undefined router', async ({ page }) => {
  const errors = collectPageErrors(page);
  await login(page);
  await gotoUserDetailPage(page);

  const userNameLinks = page.locator(selector('USER_NAME_LINK_SELECTOR', 'table a, .vxe-body--row a, a'));
  const totalUsers = Math.min(await userNameLinks.count(), 10);

  let clickedAttachment = false;
  let popupOpened = false;
  let sameTabPreview = false;

  for (let index = 0; index < totalUsers; index += 1) {
    await userNameLinks.nth(index).click();
    await expect(page.locator(selector('USER_DETAIL_MODAL_SELECTOR', 'text=用户信息')).first()).toBeVisible();
    await page.getByText('用户证书', { exact: false }).first().click();

    const attachmentLinks = page.locator(selector('CERT_ATTACHMENT_SELECTOR', '.filename a, a'));
    if (await attachmentLinks.count()) {
      const popupPromise = page.waitForEvent('popup', { timeout: 3000 }).catch(() => null);
      const beforeUrl = page.url();
      await attachmentLinks.first().click();
      const popup = await popupPromise;
      await page.waitForTimeout(800);

      popupOpened = popup !== null;
      sameTabPreview = page.url() !== beforeUrl;
      if (popup) {
        await popup.waitForLoadState('domcontentloaded').catch(() => null);
      }
      clickedAttachment = true;
      break;
    }

    const closeButton = page.locator(selector('USER_DETAIL_CLOSE_SELECTOR', '.ant-drawer-close, .ant-modal-close, [aria-label="Close"]')).first();
    if (await closeButton.count()) {
      await closeButton.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(300);
  }

  expect(clickedAttachment).toBeTruthy();
  expect(errors.some((item) => item.includes('router is not defined'))).toBeFalsy();
  expect(popupOpened || sameTabPreview).toBeTruthy();
});
