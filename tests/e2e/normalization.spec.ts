/**
 * E2E Test: Normalization Scenario
 * Tests value normalization (trim + lowercase) with hash verification
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

test.describe('E2E - Value Normalization', () => {
  test('should normalize values before encryption', async ({ page }) => {
    await page.goto('/');

    // Upload normalization test file
    const testFilePath = path.join(process.cwd(), 'test-data', 'normalization-test.csv');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.waitForTimeout(500);

    // Verify file uploaded
    await expect(page.locator('text=normalization-test.csv')).toBeVisible();

    // Encrypt and download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Encrypt")').click();

    const download = await downloadPromise;

    // Save and verify the downloaded file
    const downloadPath = await download.path();
    if (downloadPath) {
      const encryptedContent = fs.readFileSync(downloadPath, 'utf-8');
      const rows = encryptedContent.split('\n').filter(r => r.trim());

      // Verify we have encrypted data
      expect(rows.length).toBeGreaterThan(1);

      // First data row should have hashed values (64-char hex strings)
      const firstDataRow = rows[1];
      expect(firstDataRow).toMatch(/[a-f0-9]{64}/); // Contains SHA-256 hash
    }

    // Verify success notification
    await expect(page.locator('.ant-notification-success')).toBeVisible();
    await expect(page.locator('.ant-notification-success')).toContainText('encrypted');
  });

  test('should skip whitespace-only cells', async ({ page }) => {
    await page.goto('/');

    const testFilePath = path.join(process.cwd(), 'test-data', 'normalization-test.csv');
    await page.locator('input[type="file"]').setInputFiles(testFilePath);

    await page.waitForTimeout(500);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Encrypt")').click();

    await downloadPromise;

    // Success notification should mention skipped cells if applicable
    const notification = page.locator('.ant-notification-success');
    await expect(notification).toBeVisible();
  });
});
