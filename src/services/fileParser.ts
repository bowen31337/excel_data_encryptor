/**
 * File Parser Service
 * Implements Excel and CSV parsing
 * Based on contracts/encryption-service.contract.ts
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { CellValue, ParsedData } from '../types/file.types';

/**
 * Determine file type from File object
 */
export function detectFileType(file: File): 'excel' | 'csv' | 'unknown' {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  // Check MIME type
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return 'excel';
  }

  if (mimeType === 'text/csv') {
    return 'csv';
  }

  // Fallback to file extension
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return 'excel';
  }

  if (fileName.endsWith('.csv')) {
    return 'csv';
  }

  return 'unknown';
}

/**
 * Parse an Excel file (.xlsx or .xls)
 * Processes only the first sheet
 */
export async function parseExcel(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('No sheets found in Excel file'));
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
          reject(new Error('Unable to read worksheet'));
          return;
        }

        // Convert sheet to array of arrays
        const rawData: CellValue[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: undefined,
          raw: true, // Keep raw values (numbers as numbers, not strings)
        });

        // Extract headers (first row) and data rows
        const headers = (rawData[0] || []).map((h) => String(h || ''));
        const rows = rawData.slice(1);

        resolve({
          headers,
          rows,
          sheetName: firstSheetName,
          rowCount: rows.length,
          columnCount: headers.length,
        });
      } catch (error) {
        reject(new Error('Unable to read file. The file may be corrupted or password-protected.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse a CSV file
 * Handles quoted fields and auto-detects delimiters
 */
export async function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];

        // Remove empty rows at the end
        while (data.length > 0 && data[data.length - 1]?.every((cell) => !cell)) {
          data.pop();
        }

        if (data.length === 0) {
          reject(new Error('File is empty or contains no data rows.'));
          return;
        }

        // Extract headers (first row) and data rows
        const headers = data[0];
        if (!headers) {
          reject(new Error('File is missing header row.'));
          return;
        }
        const rows = data.slice(1);

        resolve({
          headers,
          rows,
          rowCount: rows.length,
          columnCount: headers.length,
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
      skipEmptyLines: false,
      delimiter: '', // Auto-detect
    });
  });
}
