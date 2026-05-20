/**
 * Integration Test: Fuzzy Matching - Scenario 2
 * Tests fuzzy column name matching (FirstName, Last_Name, Email Address, Mobile Number)
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { findColumnsToEncrypt } from '../../src/services/columnMatcher';
import { hashValue } from '../../src/services/encryptionService';
import { parseCSV } from '../../src/services/fileParser';

// Headers in contacts-fuzzy.csv that are NOT meant to be encrypted in this test.
const EXCLUDED = ['id', 'company'];

describe('Integration Test - Scenario 2: Fuzzy Column Matching', () => {
  it('should match fuzzy column names: FirstName, Last_Name, Email Address, Mobile Number', async () => {
    // Load test fixture
    const testFilePath = path.join(process.cwd(), 'test-data', 'contacts-fuzzy.csv');
    const buffer = fs.readFileSync(testFilePath);
    const blob = new Blob([buffer], { type: 'text/csv' });
    const file = new File([blob], 'contacts-fuzzy.csv', { type: 'text/csv' });

    // Step 1: Parse CSV
    const parsedData = await parseCSV(file);

    // Verify headers contain fuzzy variations
    expect(parsedData.headers).toContain('FirstName'); // No space
    expect(parsedData.headers).toContain('Last_Name'); // Underscore
    expect(parsedData.headers).toContain('Email Address'); // Space
    expect(parsedData.headers).toContain('Mobile Number'); // Space

    expect(parsedData.rows).toHaveLength(3);

    // Step 2: Column detection — excluding ID and Company, hash everything else.
    const columnMappings = findColumnsToEncrypt(parsedData.headers, EXCLUDED);
    const targetColumns = columnMappings.filter((m) => m.isTarget);

    // Should detect 4 columns to encrypt: FirstName, Last_Name, Email Address, Mobile Number
    expect(targetColumns).toHaveLength(4);

    expect(columnMappings.find((m) => m.originalName === 'FirstName')?.isTarget).toBe(true);
    expect(columnMappings.find((m) => m.originalName === 'Last_Name')?.isTarget).toBe(true);
    expect(columnMappings.find((m) => m.originalName === 'Email Address')?.isTarget).toBe(true);
    expect(columnMappings.find((m) => m.originalName === 'Mobile Number')?.isTarget).toBe(true);

    // Step 3: Encrypt
    const encryptedRows = await Promise.all(
      parsedData.rows.map(async (row) => {
        return await Promise.all(
          row.map(async (cell, colIndex) => {
            const mapping = columnMappings[colIndex];
            if (mapping?.isTarget && typeof cell === 'string' && cell.trim() !== '') {
              return await hashValue(cell);
            }
            return cell;
          })
        );
      })
    );

    // Verify all target columns encrypted (rows have: ID, FirstName, Last_Name, Email Address, Mobile Number, Company)
    // Target columns are at indices 1, 2, 3, 4
    expect(encryptedRows[0][0]).toBe('1'); // ID unchanged
    expect(encryptedRows[0][1]).toMatch(/^[a-f0-9]{64}$/); // FirstName encrypted
    expect(encryptedRows[0][2]).toMatch(/^[a-f0-9]{64}$/); // Last_Name encrypted
    expect(encryptedRows[0][3]).toMatch(/^[a-f0-9]{64}$/); // Email Address encrypted
    expect(encryptedRows[0][4]).toMatch(/^[a-f0-9]{64}$/); // Mobile Number encrypted
    expect(encryptedRows[0][5]).toBe('Tech Corp'); // Company unchanged
  });
});
