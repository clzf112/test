import { expect, test } from '@playwright/test';
import { apiFragment, collectRequests } from '../helpers/assertions';
import { login } from '../helpers/auth';
import { fixture, selector } from '../helpers/env';
import { gotoUserImportPage } from '../helpers/navigation';

test('GUNSQA-86 @GUNSQA-86 non-Excel files should be blocked before import preview API is called', async ({ page }) => {
  const requests = collectRequests(page);
  await login(page);
  await gotoUserImportPage(page);

  await page.locator(selector('USER_IMPORT_OPEN_SELECTOR', 'button:has-text("导入导出"), button:has-text("上传文件")')).first().click();
  await page.locator(selector('USER_IMPORT_FILE_INPUT_SELECTOR', 'input[type="file"]')).setInputFiles(fixture('tests/fixtures/not-excel.txt'));
  await page.waitForTimeout(1500);

  const previewApi = apiFragment('USER_IMPORT_PREVIEW_API', '/userImport/uploadAndGetPreviewData');
  const matched = requests.filter((request) => request.url().includes(previewApi));
  expect(matched).toHaveLength(0);

  const invalidFileHint = page.locator(selector('USER_IMPORT_INVALID_FILE_SELECTOR', 'text=/Excel|xls|xlsx|模板/i')).first();
  await expect(invalidFileHint).toBeVisible();
});
