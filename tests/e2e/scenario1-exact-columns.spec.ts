/**
 * E2E Test: Scenario 1 - Exact Column Names
 * Tests complete user flow with exact column name matching
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';

test.describe('E2E - Scenario 1: Exact Column Names', () => {
  test('should encrypt file with exact column names and download result', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Verify page loaded
    await expect(page.locator('h3')).toContainText('Excel Data Encryptor');

    // Upload test file
    const testFilePath = path.join(process.cwd(), 'test-data', 'employees-exact.xlsx');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Wait for file to be parsed
    await page.waitForTimeout(500);

    // Verify file info is displayed
    await expect(page.locator('text=employees-exact.xlsx')).toBeVisible();

    // Verify encrypt button is enabled
    const encryptButton = page.locator('button:has-text("Encrypt")');
    await expect(encryptButton).toBeEnabled();

    // Click encrypt button and wait for download
    const downloadPromise = page.waitForEvent('download');
    await encryptButton.click();

    const download = await downloadPromise;

    // Verify download filename pattern: employees-exact_YYYY-MM-DD_encrypted.xlsx
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/employees-exact_\d{4}-\d{2}-\d{2}_encrypted\.xlsx/);

    // Verify success notification appears
    await expect(page.locator('.ant-notification-success')).toBeVisible();
    await expect(page.locator('.ant-notification-success')).toContainText('encrypted');
  });

  test('should display detected target columns', async ({ page }) => {
    await page.goto('/');

    const testFilePath = path.join(process.cwd(), 'test-data', 'employees-exact.xlsx');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.waitForTimeout(500);

    // Verify target columns are detected and displayed
    // Should show: First Name, Last Name, Email, Mobile (4 columns)
    const detectedColumns = page.locator('text=/First Name|Last Name|Email|Mobile/');
    await expect(detectedColumns.first()).toBeVisible();
  });
});
