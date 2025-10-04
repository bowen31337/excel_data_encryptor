/**
 * Contract tests for IFileParser
 * These tests MUST fail until fileParser.ts is implemented
 * Based on contracts/encryption-service.contract.ts
 */

import { beforeAll, describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';

// Import service (will fail until implemented)
import { detectFileType, parseCSV, parseExcel } from '../../src/services/fileParser';

// Helper function to create test files
function createTestExcelFile(data: any[][]): File {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([wbout], 'test.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function createTestCSVFile(content: string): File {
  return new File([content], 'test.csv', { type: 'text/csv' });
}

describe('fileParser - detectFileType', () => {
  it('should detect Excel .xlsx files', () => {
    const file = new File([''], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    expect(detectFileType(file)).toBe('excel');
  });

  it('should detect Excel .xls files', () => {
    const file = new File([''], 'test.xls', {
      type: 'application/vnd.ms-excel',
    });

    expect(detectFileType(file)).toBe('excel');
  });

  it('should detect CSV files', () => {
    const file = new File([''], 'test.csv', { type: 'text/csv' });

    expect(detectFileType(file)).toBe('csv');
  });

  it('should return unknown for unsupported types', () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });

    expect(detectFileType(file)).toBe('unknown');
  });
});

describe('fileParser - parseExcel', () => {
  it('should parse simple Excel file with headers and data', async () => {
    const data = [
      ['Name', 'Age', 'Email'],
      ['John', 30, 'john@example.com'],
      ['Jane', 25, 'jane@example.com'],
    ];
    const file = createTestExcelFile(data);

    const result = await parseExcel(file);

    expect(result.headers).toEqual(['Name', 'Age', 'Email']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual(['John', 30, 'john@example.com']);
    expect(result.rows[1]).toEqual(['Jane', 25, 'jane@example.com']);
    expect(result.rowCount).toBe(2);
    expect(result.columnCount).toBe(3);
  });

  it('should process only the first sheet', async () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([['Sheet1', 'Data']]);
    const ws2 = XLSX.utils.aoa_to_sheet([['Sheet2', 'Data']]);

    XLSX.utils.book_append_sheet(wb, ws1, 'First');
    XLSX.utils.book_append_sheet(wb, ws2, 'Second');

    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const file = new File([wbout], 'multi-sheet.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = await parseExcel(file);

    expect(result.headers).toEqual(['Sheet1', 'Data']);
    expect(result.sheetName).toBe('First');
  });

  it('should handle empty cells as null or undefined', async () => {
    const data = [
      ['Name', 'Email', 'Phone'],
      ['John', 'john@test.com', ''],
      ['', 'jane@test.com', '555-1234'],
    ];
    const file = createTestExcelFile(data);

    const result = await parseExcel(file);

    // Empty cells can be either undefined or empty string
    const emptyCell1 = result.rows[0][2];
    const emptyCell2 = result.rows[1][0];
    expect(emptyCell1 === undefined || emptyCell1 === '').toBe(true);
    expect(emptyCell2 === undefined || emptyCell2 === '').toBe(true);
  });

  it('should handle Unicode characters', async () => {
    const data = [
      ['Name', 'Country'],
      ['张三', '中国'],
      ['José', 'España'],
    ];
    const file = createTestExcelFile(data);

    const result = await parseExcel(file);

    expect(result.rows[0]).toEqual(['张三', '中国']);
    expect(result.rows[1]).toEqual(['José', 'España']);
  });

  it('should treat first row as headers', async () => {
    const data = [['Header1', 'Header2', 'Header3']];
    const file = createTestExcelFile(data);

    const result = await parseExcel(file);

    expect(result.headers).toEqual(['Header1', 'Header2', 'Header3']);
    expect(result.rows).toHaveLength(0);
    expect(result.rowCount).toBe(0);
  });
});

describe('fileParser - parseCSV', () => {
  it('should parse simple CSV with headers and data', async () => {
    const csv = 'Name,Age,Email\nJohn,30,john@example.com\nJane,25,jane@example.com';
    const file = createTestCSVFile(csv);

    const result = await parseCSV(file);

    expect(result.headers).toEqual(['Name', 'Age', 'Email']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual(['John', '30', 'john@example.com']);
    expect(result.rows[1]).toEqual(['Jane', '25', 'jane@example.com']);
  });

  it('should handle quoted fields with commas', async () => {
    const csv = 'Name,Address\n"Doe, John","123 Main St, Apt 4"';
    const file = createTestCSVFile(csv);

    const result = await parseCSV(file);

    expect(result.rows[0]).toEqual(['Doe, John', '123 Main St, Apt 4']);
  });

  it('should handle quoted fields with newlines', async () => {
    const csv = 'Name,Description\nJohn,"Line 1\nLine 2"';
    const file = createTestCSVFile(csv);

    const result = await parseCSV(file);

    expect(result.rows[0][1]).toBe('Line 1\nLine 2');
  });

  it('should handle empty cells', async () => {
    const csv = 'Name,Email,Phone\nJohn,john@test.com,\n,jane@test.com,555-1234';
    const file = createTestCSVFile(csv);

    const result = await parseCSV(file);

    expect(result.rows[0][2]).toBe('');
    expect(result.rows[1][0]).toBe('');
  });

  it('should handle Unicode characters', async () => {
    const csv = 'Name,Country\n张三,中国\nJosé,España';
    const file = createTestCSVFile(csv);

    const result = await parseCSV(file);

    expect(result.rows[0]).toEqual(['张三', '中国']);
    expect(result.rows[1]).toEqual(['José', 'España']);
  });

  it('should auto-detect delimiters (comma)', async () => {
    const csv = 'Name,Age\nJohn,30';
    const file = createTestCSVFile(csv);

    const result = await parseCSV(file);

    expect(result.columnCount).toBe(2);
  });

  it('should handle semicolon delimiter', async () => {
    const csv = 'Name;Age\nJohn;30';
    const file = createTestCSVFile(csv);

    const result = await parseCSV(file);

    expect(result.headers).toEqual(['Name', 'Age']);
    expect(result.rows[0]).toEqual(['John', '30']);
  });

  it('should handle CSV with only headers', async () => {
    const csv = 'Header1,Header2,Header3';
    const file = createTestCSVFile(csv);

    const result = await parseCSV(file);

    expect(result.headers).toEqual(['Header1', 'Header2', 'Header3']);
    expect(result.rows).toHaveLength(0);
  });
});
