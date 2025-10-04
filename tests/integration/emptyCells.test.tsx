/**
 * Integration Test: Empty Cells - Scenario 3
 * Tests that empty cells in target columns remain empty (not encrypted)
 */

import { describe, expect, it } from 'vitest';
import { parseExcel } from '../../src/services/fileParser';
import { findTargetColumns } from '../../src/services/columnMatcher';
import { hashValue } from '../../src/services/encryptionService';
import fs from 'node:fs';
import path from 'node:path';

describe('Integration Test - Scenario 3: Empty Cells Handling', () => {
  it('should keep empty cells empty (not encrypt them)', async () => {
    // Load test fixture with empty cells
    const testFilePath = path.join(process.cwd(), 'test-data', 'incomplete-data.xlsx');
    const buffer = fs.readFileSync(testFilePath);
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const file = new File([blob], 'incomplete-data.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Step 1: Parse
    const parsedData = await parseExcel(file);
    expect(parsedData.rows).toHaveLength(3);

    // Step 2: Detect columns
    const columnMappings = findTargetColumns(parsedData.headers);

    // Step 3: Encrypt (with empty cell handling)
    const encryptedRows = await Promise.all(
      parsedData.rows.map(async (row) => {
        return await Promise.all(
          row.map(async (cell, colIndex) => {
            const mapping = columnMappings[colIndex];
            if (mapping?.isTarget && typeof cell === 'string' && cell.trim() !== '') {
              return await hashValue(cell);
            }
            // Return original value for empty/non-target cells
            return cell;
          })
        );
      })
    );

    // Row 1: Frank Miller, frank@test.com, 555-0301, Engineering
    // All fields present, should be encrypted
    expect(encryptedRows[0][0]).toMatch(/^[a-f0-9]{64}$/); // First Name: Frank
    expect(encryptedRows[0][1]).toMatch(/^[a-f0-9]{64}$/); // Last Name: Miller
    expect(encryptedRows[0][2]).toMatch(/^[a-f0-9]{64}$/); // Email
    expect(encryptedRows[0][3]).toMatch(/^[a-f0-9]{64}$/); // Mobile
    expect(encryptedRows[0][4]).toBe('Engineering'); // Department unchanged

    // Row 2: Grace, (empty), grace@test.com, (empty), Marketing
    // Last Name and Mobile are empty
    expect(encryptedRows[1][0]).toMatch(/^[a-f0-9]{64}$/); // First Name: Grace
    expect(encryptedRows[1][1]).toBe(''); // Last Name: EMPTY
    expect(encryptedRows[1][2]).toMatch(/^[a-f0-9]{64}$/); // Email
    expect(encryptedRows[1][3]).toBe(''); // Mobile: EMPTY
    expect(encryptedRows[1][4]).toBe('Marketing');

    // Row 3: (empty), Taylor, (empty), 555-0303, Sales
    // First Name and Email are empty
    expect(encryptedRows[2][0]).toBe(''); // First Name: EMPTY
    expect(encryptedRows[2][1]).toMatch(/^[a-f0-9]{64}$/); // Last Name: Taylor
    expect(encryptedRows[2][2]).toBe(''); // Email: EMPTY
    expect(encryptedRows[2][3]).toMatch(/^[a-f0-9]{64}$/); // Mobile
    expect(encryptedRows[2][4]).toBe('Sales');
  });
});
