/**
 * Contract tests for IFileGenerator
 * These tests MUST fail until fileGenerator.ts is implemented
 * Based on contracts/encryption-service.contract.ts
 */

import { describe, expect, it } from 'vitest';

// Import service (will fail until implemented)
import { generateDownloadFilename } from '../../src/services/fileGenerator';

describe('fileGenerator - generateDownloadFilename', () => {
  it('should follow pattern [name]_[YYYY-MM-DD]_encrypted.[ext]', () => {
    const date = new Date('2025-10-02');
    const result = generateDownloadFilename('employees.xlsx', date);

    expect(result).toBe('employees_2025-10-02_encrypted.xlsx');
  });

  it('should handle CSV files', () => {
    const date = new Date('2025-10-02');
    const result = generateDownloadFilename('data.csv', date);

    expect(result).toBe('data_2025-10-02_encrypted.csv');
  });

  it('should handle filenames with multiple dots', () => {
    const date = new Date('2025-10-02');
    const result = generateDownloadFilename('my.data.file.xlsx', date);

    expect(result).toBe('my.data.file_2025-10-02_encrypted.xlsx');
  });

  it("should use today's date by default", () => {
    const result = generateDownloadFilename('test.xlsx');
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    expect(result).toBe(`test_${year}-${month}-${day}_encrypted.xlsx`);
  });

  it('should handle different dates correctly', () => {
    const date1 = new Date('2025-01-01');
    const date2 = new Date('2025-12-31');

    expect(generateDownloadFilename('test.xlsx', date1)).toBe('test_2025-01-01_encrypted.xlsx');
    expect(generateDownloadFilename('test.xlsx', date2)).toBe('test_2025-12-31_encrypted.xlsx');
  });

  it('should pad month and day with zeros', () => {
    const date = new Date('2025-03-05');
    const result = generateDownloadFilename('test.xlsx', date);

    expect(result).toBe('test_2025-03-05_encrypted.xlsx');
  });

  it('should handle xls files', () => {
    const date = new Date('2025-10-02');
    const result = generateDownloadFilename('legacy.xls', date);

    expect(result).toBe('legacy_2025-10-02_encrypted.xls');
  });

  it('should preserve original extension', () => {
    const date = new Date('2025-10-02');

    expect(generateDownloadFilename('file.xlsx', date)).toContain('.xlsx');
    expect(generateDownloadFilename('file.xls', date)).toContain('.xls');
    expect(generateDownloadFilename('file.csv', date)).toContain('.csv');
  });

  it('should handle filenames with no extension', () => {
    const date = new Date('2025-10-02');
    const result = generateDownloadFilename('filename', date);

    // Should still work, just without extension
    expect(result).toBe('filename_2025-10-02_encrypted');
  });

  it('should handle long filenames', () => {
    const date = new Date('2025-10-02');
    const longName = 'a'.repeat(100) + '.xlsx';
    const result = generateDownloadFilename(longName, date);

    expect(result).toContain('_2025-10-02_encrypted.xlsx');
  });
});
