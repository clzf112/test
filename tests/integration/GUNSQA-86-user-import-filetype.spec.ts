import { expect, test } from '@playwright/test';
import { apiFragment } from '../helpers/assertions';
import { login } from '../helpers/auth';
import { fixture, selector } from '../helpers/env';
import { gotoUserImportPage } from '../helpers/navigation';

test('GUNSQA-86 @GUNSQA-86 non-Excel files should be blocked before import preview API is called', async ({ page }) => {
  let previewCalled = false;
  const previewApi = apiFragment('USER_IMPORT_PREVIEW_API', '/userImport/uploadAndGetPreviewData');
  await page.route(`**${previewApi}**`, async (route) => {
    previewCalled = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: '500', success: false, message: 'mock preview call' }),
    });
  });

  await login(page);
  await gotoUserImportPage(page);

  await page.locator(selector('USER_IMPORT_MORE_SELECTOR', 'button:has-text("更多")')).first().click();
  await page.locator(selector('USER_IMPORT_ENTRY_SELECTOR', 'text=导入导出')).last().click();
  await expect(page.locator('text=导入导出用户').first()).toBeVisible();
  await expect(page.locator('text=上传Excel').first()).toBeVisible();

  await page.locator(selector('USER_IMPORT_FILE_INPUT_SELECTOR', '.ant-upload input[type="file"], input[type="file"]')).first().setInputFiles(fixture('tests/fixtures/not-excel.txt'));
  await page.waitForTimeout(1500);

  expect(previewCalled).toBeFalsy();
  const invalidFileHint = page.locator(selector('USER_IMPORT_INVALID_FILE_SELECTOR', 'text=/Excel|xls|xlsx|模板/i')).first();
  await expect(invalidFileHint).toBeVisible();
});
