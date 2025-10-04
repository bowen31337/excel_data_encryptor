/**
 * E2E Test: Scenario 2 - Fuzzy Column Matching
 * Tests fuzzy column name matching (FirstName, Last_Name, etc.)
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';

test.describe('E2E - Scenario 2: Fuzzy Column Matching', () => {
  test('should match fuzzy column names and encrypt successfully', async ({ page }) => {
    await page.goto('/');

    // Upload CSV with fuzzy column names
    const testFilePath = path.join(process.cwd(), 'test-data', 'contacts-fuzzy.csv');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.waitForTimeout(500);

    // Verify file info
    await expect(page.locator('text=contacts-fuzzy.csv')).toBeVisible();

    // Verify fuzzy columns are detected
    // FirstName, Last_Name, Email Address, Mobile Number should all be detected
    await expect(page.locator('button:has-text("Encrypt")')).toBeEnabled();

    // Encrypt and download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Encrypt")').click();

    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/contacts-fuzzy_\d{4}-\d{2}-\d{2}_encrypted\.csv/);

    // Verify success
    await expect(page.locator('.ant-notification-success')).toBeVisible();
  });

  test('should handle underscores and spaces in column names', async ({ page }) => {
    await page.goto('/');

    const testFilePath = path.join(process.cwd(), 'test-data', 'contacts-fuzzy.csv');
    await page.locator('input[type="file"]').setInputFiles(testFilePath);

    await page.waitForTimeout(500);

    // All fuzzy variations should be detected
    // The app should show that target columns were found
    const encryptButton = page.locator('button:has-text("Encrypt")');
    await expect(encryptButton).toBeEnabled();
    await expect(encryptButton).not.toBeDisabled();
  });
});
