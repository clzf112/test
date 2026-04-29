import { expect, test } from '@playwright/test';
import { collectPageErrors } from '../helpers/assertions';
import { fixture, selector } from '../helpers/env';
import { login } from '../helpers/auth';
import { gotoUserDetailPage } from '../helpers/navigation';

test('GUNSQA-85 @GUNSQA-85 user certificate attachment preview should not crash on undefined router', async ({ page }) => {
  const errors = collectPageErrors(page);
  await login(page);
  await gotoUserDetailPage(page);

  const userNameLinks = page.locator(
    selector('USER_NAME_LINK_SELECTOR', '.table-content .ant-table-tbody a:visible, .table-content .vxe-body--row a:visible')
  );
  const editIcons = page.locator(selector('USER_EDIT_SELECTOR', '.table-content [title="编辑"]:visible'));

  await expect(userNameLinks.first()).toBeVisible();
  await expect(editIcons.first()).toBeVisible();

  await editIcons.first().click();
  await expect(page.locator('text=编辑用户').first()).toBeVisible();
  await expect(page.locator('.card-title:has-text("证书信息")').first()).toBeVisible();

  const existingAttachment = page.locator('.vxe-table .filename a:visible').first();
  if ((await existingAttachment.count()) === 0) {
    await page.getByRole('button', { name: '添加证书' }).click();

    const certNoInput = page.locator('.vxe-table input[placeholder="请输入证书编号"]').first();
    if (await certNoInput.count()) {
      await certNoInput.fill(`AUTO-${Date.now()}`);
    }

    const authorityInput = page.locator('.vxe-table input[placeholder="请输入发证机构名称"]').first();
    if (await authorityInput.count()) {
      await authorityInput.fill('GUNS QA');
    }

    const uploadInput = page.locator(selector('CERT_UPLOAD_INPUT_SELECTOR', '.vxe-table .ant-upload input[type="file"]')).first();
    await uploadInput.setInputFiles(fixture('tests/fixtures/certificate-sample.pdf'));
    await expect(page.locator('.vxe-table .filename a:visible').first()).toBeVisible({ timeout: 15000 });

    await page.locator('.ant-modal-footer .ant-btn-primary').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('text=编辑用户').first()).toHaveCount(0);
  } else {
    await page.locator('.ant-modal-footer .ant-btn-default').click();
    await expect(page.locator('text=编辑用户').first()).toHaveCount(0);
  }

  await expect(userNameLinks.first()).toBeVisible();
  await userNameLinks.first().click();

  const detailDrawer = page.locator(selector('USER_DETAIL_MODAL_SELECTOR', 'text=用户信息')).first();
  await expect(detailDrawer).toBeVisible();
  await page.getByText('用户证书', { exact: false }).first().click();

  const attachmentLinks = page.locator(selector('CERT_ATTACHMENT_SELECTOR', '.filename a:visible'));
  await expect(attachmentLinks.first()).toBeVisible();

  const popupPromise = page.waitForEvent('popup', { timeout: 3000 }).catch(() => null);
  const beforeUrl = page.url();
  await attachmentLinks.first().click();
  const popup = await popupPromise;
  await page.waitForTimeout(800);

  const popupOpened = popup !== null;
  const sameTabPreview = page.url() !== beforeUrl;
  if (popup) {
    await popup.waitForLoadState('domcontentloaded').catch(() => null);
  }

  expect(errors.some((item) => item.includes('router is not defined'))).toBeFalsy();
  expect(popupOpened || sameTabPreview).toBeTruthy();
});
