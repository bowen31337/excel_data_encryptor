/**
 * Integration Test: Error Handling - Scenario 4
 * Tests file with no target columns (should be detected as error case)
 */

import { describe, expect, it } from 'vitest';
import { parseCSV } from '../../src/services/fileParser';
import { findTargetColumns, hasTargetColumns } from '../../src/services/columnMatcher';
import fs from 'node:fs';
import path from 'node:path';

describe('Integration Test - Scenario 4: No Target Columns Error', () => {
  it('should detect when file has no target columns', async () => {
    // Load test fixture with no target columns
    const testFilePath = path.join(process.cwd(), 'test-data', 'no-targets.csv');
    const buffer = fs.readFileSync(testFilePath);
    const blob = new Blob([buffer], { type: 'text/csv' });
    const file = new File([blob], 'no-targets.csv', { type: 'text/csv' });

    // Step 1: Parse
    const parsedData = await parseCSV(file);

    // Verify headers are non-target columns
    expect(parsedData.headers).toContain('ID');
    expect(parsedData.headers).toContain('Product');
    expect(parsedData.headers).toContain('Price');
    expect(parsedData.headers).toContain('Quantity');

    // Step 2: Detect columns
    const columnMappings = findTargetColumns(parsedData.headers);
    const targetColumns = columnMappings.filter(m => m.isTarget);

    // Should find ZERO target columns
    expect(targetColumns).toHaveLength(0);

    // Verify hasTargetColumns helper returns false
    expect(hasTargetColumns(parsedData.headers)).toBe(false);

    // This should trigger error in UI:
    // "No target columns found. Please ensure your file contains at least one of:
    //  First Name, Last Name, Email, Mobile, Phone"
  });

  it('should identify all columns as non-target', async () => {
    const testFilePath = path.join(process.cwd(), 'test-data', 'no-targets.csv');
    const buffer = fs.readFileSync(testFilePath);
    const blob = new Blob([buffer], { type: 'text/csv' });
    const file = new File([blob], 'no-targets.csv', { type: 'text/csv' });

    const parsedData = await parseCSV(file);
    const columnMappings = findTargetColumns(parsedData.headers);

    // All columns should have isTarget = false
    for (const mapping of columnMappings) {
      expect(mapping.isTarget).toBe(false);
      expect(mapping.targetType).toBeUndefined();
    }
  });
});
