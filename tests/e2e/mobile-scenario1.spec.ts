/**
 * E2E Test: Mobile Scenario 1 - iPhone Viewport
 * Tests mobile upload on 375px iPhone viewport
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';

test.describe('E2E - Mobile: iPhone 375px Viewport', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
    isMobile: true,
    hasTouch: true,
  });

  test('should work on iPhone-sized screen with no horizontal scroll', async ({ page }) => {
    await page.goto('/');

    // Verify no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);

    // Verify page elements are visible
    await expect(page.locator('h3')).toBeVisible();

    // Upload file using file input (touch devices use native picker)
    const testFilePath = path.join(process.cwd(), 'test-data', 'contacts-fuzzy.csv');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.waitForTimeout(500);

    // Verify file info is visible on mobile
    await expect(page.locator('text=contacts-fuzzy.csv')).toBeVisible();

    // Verify touch target size (buttons should be ≥44px)
    const encryptButton = page.locator('button:has-text("Encrypt")');
    const buttonHeight = await encryptButton.evaluate(el => el.clientHeight);
    expect(buttonHeight).toBeGreaterThanOrEqual(44);

    // Encrypt and download
    const downloadPromise = page.waitForEvent('download');
    await encryptButton.click();

    await downloadPromise;

    // Verify success notification fits on screen
    const notification = page.locator('.ant-notification-success');
    await expect(notification).toBeVisible();
  });

  test('should have readable text on small screen', async ({ page }) => {
    await page.goto('/');

    // Verify font sizes are readable (≥14px for body text)
    const bodyText = page.locator('p, span, div').first();
    const fontSize = await bodyText.evaluate(el => {
      return parseInt(window.getComputedStyle(el).fontSize);
    });

    expect(fontSize).toBeGreaterThanOrEqual(14);
  });
});
