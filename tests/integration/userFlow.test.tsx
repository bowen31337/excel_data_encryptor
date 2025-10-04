/**
 * Integration Test: User Flow - Scenario 1 (Exact Column Names)
 * Tests end-to-end flow with exact column name matching
 */

import { describe, expect, it } from 'vitest';
import { parseExcel } from '../../src/services/fileParser';
import { findTargetColumns } from '../../src/services/columnMatcher';
import { hashValue } from '../../src/services/encryptionService';
import { generateExcel, generateDownloadFilename } from '../../src/services/fileGenerator';
import fs from 'node:fs';
import path from 'node:path';

describe('Integration Test - Scenario 1: Exact Column Names', () => {
  it('should process employees-exact.xlsx with exact column name matching', async () => {
    // Load test fixture
    const testFilePath = path.join(process.cwd(), 'test-data', 'employees-exact.xlsx');
    const buffer = fs.readFileSync(testFilePath);
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const file = new File([blob], 'employees-exact.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Step 1: Parse Excel file
    const parsedData = await parseExcel(file);

    // Verify headers
    expect(parsedData.headers).toContain('First Name');
    expect(parsedData.headers).toContain('Last Name');
    expect(parsedData.headers).toContain('Email');
    expect(parsedData.headers).toContain('Mobile');
    expect(parsedData.headers).toContain('Department');

    // Verify data rows
    expect(parsedData.rows).toHaveLength(2);
    expect(parsedData.rowCount).toBe(2);

    // Step 2: Detect target columns
    const columnMappings = findTargetColumns(parsedData.headers);
    const targetColumns = columnMappings.filter(m => m.isTarget);

    // Should detect 4 target columns (First Name, Last Name, Email, Mobile)
    expect(targetColumns).toHaveLength(4);

    // Verify exact matching
    expect(targetColumns.map(c => c.originalName)).toContain('First Name');
    expect(targetColumns.map(c => c.originalName)).toContain('Last Name');
    expect(targetColumns.map(c => c.originalName)).toContain('Email');
    expect(targetColumns.map(c => c.originalName)).toContain('Mobile');

    // Step 3: Encrypt target columns
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

    // Verify encryption occurred
    expect(encryptedRows[0][0]).toMatch(/^[a-f0-9]{64}$/); // First Name hashed
    expect(encryptedRows[0][1]).toMatch(/^[a-f0-9]{64}$/); // Last Name hashed
    expect(encryptedRows[0][2]).toMatch(/^[a-f0-9]{64}$/); // Email hashed
    expect(encryptedRows[0][3]).toMatch(/^[a-f0-9]{64}$/); // Mobile hashed
    expect(encryptedRows[0][4]).toBe('Engineering'); // Department unchanged

    // Step 4: Generate output file
    const outputData = { ...parsedData, rows: encryptedRows };
    const outputBlob = generateExcel(outputData);
    expect(outputBlob.type).toContain('spreadsheet');

    // Step 5: Verify filename generation
    const filename = generateDownloadFilename('employees-exact.xlsx');
    expect(filename).toMatch(/employees-exact_\d{4}-\d{2}-\d{2}_encrypted\.xlsx/);
  });
});
