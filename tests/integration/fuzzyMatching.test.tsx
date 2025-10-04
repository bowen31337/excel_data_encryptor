/**
 * Integration Test: Fuzzy Matching - Scenario 2
 * Tests fuzzy column name matching (FirstName, Last_Name, Email Address, Mobile Number)
 */

import { describe, expect, it } from 'vitest';
import { parseCSV } from '../../src/services/fileParser';
import { findTargetColumns } from '../../src/services/columnMatcher';
import { hashValue } from '../../src/services/encryptionService';
import fs from 'node:fs';
import path from 'node:path';

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

    // Step 2: Fuzzy column detection
    const columnMappings = findTargetColumns(parsedData.headers);
    const targetColumns = columnMappings.filter(m => m.isTarget);

    // Should detect all 4 target columns despite fuzzy names
    expect(targetColumns).toHaveLength(4);

    // Verify fuzzy matching worked
    const firstNameCol = columnMappings.find(m => m.originalName === 'FirstName');
    expect(firstNameCol?.isTarget).toBe(true);
    expect(firstNameCol?.targetType).toBe('FIRST_NAME');

    const lastNameCol = columnMappings.find(m => m.originalName === 'Last_Name');
    expect(lastNameCol?.isTarget).toBe(true);
    expect(lastNameCol?.targetType).toBe('LAST_NAME');

    const emailCol = columnMappings.find(m => m.originalName === 'Email Address');
    expect(emailCol?.isTarget).toBe(true);
    expect(emailCol?.targetType).toBe('EMAIL');

    const mobileCol = columnMappings.find(m => m.originalName === 'Mobile Number');
    expect(mobileCol?.isTarget).toBe(true);
    expect(mobileCol?.targetType).toBe('MOBILE');

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
