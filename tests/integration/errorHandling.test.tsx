/**
 * Integration Test: Error Handling
 * Under the exclusion-list model, the error state is "all columns excluded".
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { findColumnsToEncrypt, hasColumnsToEncrypt } from '../../src/services/columnMatcher';
import { parseCSV } from '../../src/services/fileParser';

describe('Integration Test - All-Excluded Error Case', () => {
  it('reports "nothing to encrypt" when every header is in the exclusion list', async () => {
    const testFilePath = path.join(process.cwd(), 'test-data', 'no-targets.csv');
    const buffer = fs.readFileSync(testFilePath);
    const blob = new Blob([buffer], { type: 'text/csv' });
    const file = new File([blob], 'no-targets.csv', { type: 'text/csv' });

    const parsedData = await parseCSV(file);

    expect(parsedData.headers).toContain('ID');
    expect(parsedData.headers).toContain('Product');
    expect(parsedData.headers).toContain('Price');
    expect(parsedData.headers).toContain('Quantity');

    const excludeAll = ['id', 'product', 'price', 'quantity', 'category'];
    const columnMappings = findColumnsToEncrypt(parsedData.headers, excludeAll);
    const targetColumns = columnMappings.filter((m) => m.isTarget);

    expect(targetColumns).toHaveLength(0);
    expect(hasColumnsToEncrypt(parsedData.headers, excludeAll)).toBe(false);
  });

  it('encrypts every column by default (empty exclusion list)', async () => {
    const testFilePath = path.join(process.cwd(), 'test-data', 'no-targets.csv');
    const buffer = fs.readFileSync(testFilePath);
    const blob = new Blob([buffer], { type: 'text/csv' });
    const file = new File([blob], 'no-targets.csv', { type: 'text/csv' });

    const parsedData = await parseCSV(file);
    const columnMappings = findColumnsToEncrypt(parsedData.headers, []);

    expect(columnMappings.every((m) => m.isTarget)).toBe(true);
  });
});
