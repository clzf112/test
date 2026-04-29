import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { env, joinUrl, requiredEnv, selector } from './env';

export async function login(page: Page): Promise<void> {
  const baseURL = requiredEnv('APP_BASE_URL');
  const username = requiredEnv('APP_USERNAME');
  const password = requiredEnv('APP_PASSWORD');
  const loginPath = env('LOGIN_PATH', '/login');

  await page.goto(joinUrl(baseURL, loginPath), { waitUntil: 'networkidle' });
  await page.locator(selector('LOGIN_USERNAME_SELECTOR', 'input[placeholder*=用户名], input[name="username"], input[type="text"]')).first().fill(username);
  await page.locator(selector('LOGIN_PASSWORD_SELECTOR', 'input[placeholder*=密码], input[name="password"], input[type="password"]')).first().fill(password);
  await page.locator(selector('LOGIN_SUBMIT_SELECTOR', 'button:has-text("登录"), button[type="submit"]')).first().click();
  await page.waitForLoadState('networkidle');

  const successMarker = selector('LOGIN_SUCCESS_SELECTOR', 'body');
  await expect(page.locator(successMarker).first()).toBeVisible();
}
