import { expect, test } from '@playwright/test';
import { collectPageErrors } from '../helpers/assertions';
import { fixture, selector } from '../helpers/env';
import { login } from '../helpers/auth';
import { gotoUserDetailPage } from '../helpers/navigation';

test('GUNSQA-85 @GUNSQA-85 user certificate attachment preview should not crash on undefined router', async ({ page }) => {
  const errors = collectPageErrors(page);
  let stage = 'login';

  await login(page);
  await gotoUserDetailPage(page);

  const userNameLinks = page.locator(
    selector('USER_NAME_LINK_SELECTOR', '.table-content .ant-table-tbody a:visible, .table-content .vxe-body--row a:visible')
  );
  const editIcons = page.locator(selector('USER_EDIT_SELECTOR', '.table-content [title="编辑"]:visible'));

  stage = 'locate user row';
  await expect(userNameLinks.first()).toBeVisible();
  await expect(editIcons.first()).toBeVisible();

  stage = 'open edit modal';
  await editIcons.first().click();
  await expect(page.locator('text=编辑用户').first()).toBeVisible();
  await expect(page.locator('.card-title:has-text("证书信息")').first()).toBeVisible();

  const existingAttachment = page.locator('.vxe-table .filename a:visible').first();
  if ((await existingAttachment.count()) === 0) {
    stage = 'create certificate row';
    await page.getByRole('button', { name: '添加证书' }).click();

    const certNoInput = page.locator('.vxe-table input[placeholder="请输入证书编号"]').first();
    if (await certNoInput.count()) {
      await certNoInput.fill(`AUTO-${Date.now()}`);
    }

    const authorityInput = page.locator('.vxe-table input[placeholder="请输入发证机构名称"]').first();
    if (await authorityInput.count()) {
      await authorityInput.fill('GUNS QA');
    }

    stage = 'upload seeded attachment';
    const uploadInput = page.locator(selector('CERT_UPLOAD_INPUT_SELECTOR', '.vxe-table .ant-upload input[type="file"]')).first();
    await uploadInput.setInputFiles(fixture('tests/fixtures/certificate-sample.pdf'));
    await expect(page.locator('.vxe-table .filename a:visible').first(), `Attachment was not visible after upload during stage: ${stage}`).toBeVisible({ timeout: 15000 });

    stage = 'save edited user';
    await page.locator('.ant-modal-footer .ant-btn-primary').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('text=编辑用户').first(), `Edit modal did not close during stage: ${stage}`).toHaveCount(0);
  } else {
    stage = 'close edit modal with existing attachment';
    await page.locator('.ant-modal-footer .ant-btn-default').click();
    await expect(page.locator('text=编辑用户').first(), `Edit modal did not close during stage: ${stage}`).toHaveCount(0);
  }

  stage = 'open detail drawer';
  await expect(userNameLinks.first()).toBeVisible();
  await userNameLinks.first().click();

  const detailDrawer = page.locator(selector('USER_DETAIL_MODAL_SELECTOR', 'text=用户信息')).first();
  await expect(detailDrawer, `Detail drawer was not visible during stage: ${stage}`).toBeVisible();
  await page.getByText('用户证书', { exact: false }).first().click();

  stage = 'locate attachment in detail drawer';
  const attachmentLinks = page.locator(selector('CERT_ATTACHMENT_SELECTOR', '.filename a:visible'));
  await expect(attachmentLinks.first(), `No visible attachment link found during stage: ${stage}`).toBeVisible();

  stage = 'click attachment preview';
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

  expect(errors.some((item) => item.includes('router is not defined')), `router error detected during stage: ${stage}; errors=${errors.join(' | ')}`).toBeFalsy();
  expect(popupOpened || sameTabPreview, `Preview did not open during stage: ${stage}`).toBeTruthy();
});
