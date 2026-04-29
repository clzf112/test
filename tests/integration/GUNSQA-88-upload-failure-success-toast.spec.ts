import { expect, test } from '@playwright/test';
import { login } from '../helpers/auth';
import { fixture, selector } from '../helpers/env';
import { gotoFileUploadPage } from '../helpers/navigation';

test('GUNSQA-88 @GUNSQA-88 upload failure must not be reported as success', async ({ page }) => {
  let interceptedUploadUrl = '';
  await login(page);

  await page.route('**/sysFileInfo/upload**', async (route) => {
    const requestUrl = route.request().url();
    if (!requestUrl.includes('fileLocation=5')) {
      await route.continue();
      return;
    }

    interceptedUploadUrl = requestUrl;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 500, success: false, message: 'mock upload failure' }),
    });
  });

  await gotoFileUploadPage(page);

  const uploadInputs = page.locator(selector('FILE_UPLOAD_INPUT_SELECTOR', '.ant-upload input[type="file"], input[type="file"]'));
  expect(await uploadInputs.count()).toBeGreaterThan(1);
  await uploadInputs.nth(1).setInputFiles(fixture('tests/fixtures/upload-sample.txt'));
  await expect.poll(() => interceptedUploadUrl).not.toBe('');
  await page.waitForTimeout(1500);

  const successToast = page.locator(selector('FILE_UPLOAD_SUCCESS_SELECTOR', '.ant-message:has-text("上传成功"), .ant-message-notice:has-text("上传成功"), text=上传成功')).first();
  await expect(successToast).toHaveCount(0);

  const failureToast = page.locator(selector('FILE_UPLOAD_FAILURE_SELECTOR', 'text=/失败|错误|mock upload failure/i')).first();
  await expect(failureToast).toBeVisible();
});
