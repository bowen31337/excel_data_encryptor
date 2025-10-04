/**
 * E2E Test: Scenario 4 - No Target Columns Error
 * Tests error handling when file has no target columns
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';

test.describe('E2E - Scenario 4: No Target Columns Error', () => {
  test('should show error notification when no target columns found', async ({ page }) => {
    await page.goto('/');

    // Upload file with no target columns
    const testFilePath = path.join(process.cwd(), 'test-data', 'no-targets.csv');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.waitForTimeout(500);

    // Verify file is uploaded
    await expect(page.locator('text=no-targets.csv')).toBeVisible();

    // Verify error notification appears
    await expect(page.locator('.ant-notification-error')).toBeVisible();
    await expect(page.locator('.ant-notification-error')).toContainText('No target columns');

    // Encrypt button should be disabled or show appropriate state
    // (Depends on implementation - may prevent encryption or show warning)
  });

  test('should display helpful error message', async ({ page }) => {
    await page.goto('/');

    const testFilePath = path.join(process.cwd(), 'test-data', 'no-targets.csv');
    await page.locator('input[type="file"]').setInputFiles(testFilePath);

    await page.waitForTimeout(500);

    // Error message should guide user
    const errorNotification = page.locator('.ant-notification-error');
    await expect(errorNotification).toBeVisible();

    // Should mention what columns are supported
    const errorText = await errorNotification.textContent();
    expect(errorText?.toLowerCase()).toMatch(/first name|last name|email|mobile|phone/i);
  });
});
