/**
 * Integration Tests: Complete File Processing Flow
 * Tests upload → parse → encrypt → download workflows
 */

import { describe, expect, it } from 'vitest';
import { parseCSV, parseExcel } from '../../src/services/fileParser';
import { findTargetColumns } from '../../src/services/columnMatcher';
import { hashValue } from '../../src/services/encryptionService';
import { generateCSV, generateExcel, generateDownloadFilename } from '../../src/services/fileGenerator';

describe('File Processing Integration - CSV Flow', () => {
  it('should process CSV file end-to-end: parse → detect → encrypt → generate', async () => {
    // Step 1: Create mock CSV file
    const csvContent = `First Name,Last Name,Email,Mobile
John,Doe,john@example.com,555-1234
Jane,Smith,jane@example.com,555-5678`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'test.csv', { type: 'text/csv' });

    // Step 2: Parse the file
    const parsedData = await parseCSV(file);
    expect(parsedData.headers).toEqual(['First Name', 'Last Name', 'Email', 'Mobile']);
    expect(parsedData.rows).toHaveLength(2);
    expect(parsedData.rowCount).toBe(2);
    expect(parsedData.columnCount).toBe(4);

    // Step 3: Detect target columns
    const columnMappings = findTargetColumns(parsedData.headers);
    const targetColumns = columnMappings.filter((m) => m.isTarget);
    expect(targetColumns).toHaveLength(4); // All 4 columns are targets

    // Step 4: Encrypt target column values
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
    expect(encryptedRows[0][0]).not.toBe('John'); // First name encrypted
    expect(encryptedRows[0][0]).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash format
    expect(encryptedRows[0][2]).not.toBe('john@example.com'); // Email encrypted

    // Step 5: Generate output file
    const outputData = {
      ...parsedData,
      rows: encryptedRows,
    };
    const outputBlob = generateCSV(outputData);
    expect(outputBlob.type).toBe('text/csv;charset=utf-8;');
    expect(outputBlob.size).toBeGreaterThan(0);

    // Step 6: Verify download filename
    const filename = generateDownloadFilename('test.csv');
    expect(filename).toMatch(/test_\d{4}-\d{2}-\d{2}_encrypted\.csv/);
  });

  it('should handle empty cells correctly (skip encryption)', async () => {
    const csvContent = `First Name,Last Name,Email
John,Doe,john@example.com
Jane,,jane@example.com
,,empty@example.com`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'incomplete.csv', { type: 'text/csv' });

    const parsedData = await parseCSV(file);
    const columnMappings = findTargetColumns(parsedData.headers);

    const encryptedRows = await Promise.all(
      parsedData.rows.map(async (row) => {
        return await Promise.all(
          row.map(async (cell, colIndex) => {
            const mapping = columnMappings[colIndex];
            if (mapping?.isTarget && typeof cell === 'string' && cell.trim() !== '') {
              return await hashValue(cell);
            }
            return cell; // Return original for empty/non-target cells
          })
        );
      })
    );

    // Row 2: Last Name is empty, should remain empty
    expect(encryptedRows[1][1]).toBe('');

    // Row 3: First Name and Last Name are empty
    expect(encryptedRows[2][0]).toBe('');
    expect(encryptedRows[2][1]).toBe('');
  });
});

describe('File Processing Integration - Normalization', () => {
  it('should normalize values (trim + lowercase) before encryption', async () => {
    const csvContent = `FirstName,LastName
  JOHN  ,  DOE
JOHN,DOE
john,doe`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'normalize.csv', { type: 'text/csv' });

    const parsedData = await parseCSV(file);
    const columnMappings = findTargetColumns(parsedData.headers);

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

    // All three rows should produce identical hashes after normalization
    expect(encryptedRows[0][0]).toBe(encryptedRows[1][0]); // "  JOHN  " === "JOHN"
    expect(encryptedRows[1][0]).toBe(encryptedRows[2][0]); // "JOHN" === "john"
    expect(encryptedRows[0][1]).toBe(encryptedRows[1][1]); // "  DOE  " === "DOE"
    expect(encryptedRows[1][1]).toBe(encryptedRows[2][1]); // "DOE" === "doe"
  });

  it('should skip encryption for whitespace-only cells', async () => {
    const csvContent = `FirstName,Email
John,john@example.com
   ,test@example.com
,another@example.com`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'whitespace.csv', { type: 'text/csv' });

    const parsedData = await parseCSV(file);
    const columnMappings = findTargetColumns(parsedData.headers);

    const encryptedRows = await Promise.all(
      parsedData.rows.map(async (row) => {
        return await Promise.all(
          row.map(async (cell, colIndex) => {
            const mapping = columnMappings[colIndex];
            if (mapping?.isTarget && typeof cell === 'string' && cell.trim() !== '') {
              return await hashValue(cell);
            }
            return cell === null || cell === undefined ? '' : cell;
          })
        );
      })
    );

    // Row 1: Normal encryption
    expect(encryptedRows[0][0]).toMatch(/^[a-f0-9]{64}$/);
    expect(encryptedRows[0][1]).toMatch(/^[a-f0-9]{64}$/);

    // Row 2: Whitespace-only first name, should remain as is (not hashed)
    expect(encryptedRows[1][0]).toBe('   ');

    // Row 3: Empty first name, should remain empty
    expect(encryptedRows[2][0]).toBe('');
  });
});

describe('File Processing Integration - Phone Column', () => {
  it('should detect and encrypt Phone column variations', async () => {
    const csvContent = `Name,Phone Number,Email
Alice,555-1234,alice@test.com
Bob,555-5678,bob@test.com`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'phone.csv', { type: 'text/csv' });

    const parsedData = await parseCSV(file);
    const columnMappings = findTargetColumns(parsedData.headers);

    // Verify "Phone Number" is detected as a target column
    const phoneColumn = columnMappings.find((m) => m.originalName === 'Phone Number');
    expect(phoneColumn?.isTarget).toBe(true);
    expect(phoneColumn?.targetType).toBe('PHONE');

    // Verify encryption works on Phone column
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

    // Phone numbers should be encrypted
    expect(encryptedRows[0][1]).toMatch(/^[a-f0-9]{64}$/);
    expect(encryptedRows[1][1]).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('File Processing Integration - Error Scenarios', () => {
  it('should handle file with no target columns', async () => {
    const csvContent = `ID,Product,Price
101,Widget,19.99
102,Gadget,29.99`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'no-targets.csv', { type: 'text/csv' });

    const parsedData = await parseCSV(file);
    const columnMappings = findTargetColumns(parsedData.headers);

    const targetColumns = columnMappings.filter((m) => m.isTarget);
    expect(targetColumns).toHaveLength(0); // No target columns detected

    // This should trigger an error in the UI
    // For now, just verify detection works
  });

  it('should generate correct filename with multiple dots', async () => {
    const filename1 = generateDownloadFilename('my.file.name.csv');
    expect(filename1).toMatch(/my\.file\.name_\d{4}-\d{2}-\d{2}_encrypted\.csv/);

    const filename2 = generateDownloadFilename('data.backup.v2.xlsx');
    expect(filename2).toMatch(/data\.backup\.v2_\d{4}-\d{2}-\d{2}_encrypted\.xlsx/);
  });
});
