/**
 * File Generator Service
 * Implements file generation and download functionality
 * Based on contracts/encryption-service.contract.ts
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ParsedData } from '../types/file.types';

/**
 * Generate an Excel file from ParsedData
 */
export function generateExcel(data: ParsedData, _originalFilename?: string): Blob {
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();

  // Combine headers and rows
  const sheetData = [data.headers, ...data.rows];

  // Create worksheet from array of arrays
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Add worksheet to workbook
  const sheetName = data.sheetName || 'Sheet1';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Write workbook to array buffer
  const wbout = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  // Create Blob
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Generate a CSV file from ParsedData
 */
export function generateCSV(data: ParsedData): Blob {
  // Combine headers and rows
  const csvData = [data.headers, ...data.rows];

  // Convert to CSV string
  const csv = Papa.unparse(csvData, {
    quotes: true,
    quoteChar: '"',
    escapeChar: '"',
  });

  // Create Blob
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Generate download filename with timestamp
 * Pattern: [name]_[YYYY-MM-DD]_encrypted.[ext]
 */
export function generateDownloadFilename(originalFilename: string, date?: Date): string {
  const now = date || new Date();

  // Format date as YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  // Extract filename and extension
  const lastDotIndex = originalFilename.lastIndexOf('.');
  let name: string;
  let extension: string;

  if (lastDotIndex === -1) {
    // No extension
    name = originalFilename;
    extension = '';
  } else {
    name = originalFilename.substring(0, lastDotIndex);
    extension = originalFilename.substring(lastDotIndex); // Includes the dot
  }

  return `${name}_${dateStr}_encrypted${extension}`;
}

/**
 * Trigger browser download of a Blob
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  // Clean up
  URL.revokeObjectURL(url);
}
