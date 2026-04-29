import { expect, test } from '@playwright/test';
import { login } from '../helpers/auth';
import { fixture, selector } from '../helpers/env';
import { gotoFileUploadPage } from '../helpers/navigation';

test('GUNSQA-88 @GUNSQA-88 upload failure must not be reported as success', async ({ page }) => {
  await login(page);

  const uploadApi = process.env.FILE_UPLOAD_API || '/sysFileInfo/uploadToDb';
  await page.route(`**${uploadApi}**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 500, success: false, message: 'mock upload failure' }),
    });
  });

  await gotoFileUploadPage(page);
  await page.locator(selector('FILE_UPLOAD_INPUT_SELECTOR', 'input[type="file"]')).setInputFiles(fixture('tests/fixtures/upload-sample.txt'));
  await page.waitForTimeout(1500);

  const successToast = page.locator(selector('FILE_UPLOAD_SUCCESS_SELECTOR', 'text=上传成功')).first();
  await expect(successToast).toHaveCount(0);

  const failureToast = page.locator(selector('FILE_UPLOAD_FAILURE_SELECTOR', 'text=/失败|错误|mock upload failure/i')).first();
  await expect(failureToast).toBeVisible();
});
