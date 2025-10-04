/**
 * Type definitions for file-related entities
 * Based on data-model.md
 */

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export type CellValue = string | number | boolean | null | undefined;

export interface ParsedData {
  headers: string[];
  rows: CellValue[][];
  sheetName?: string;
  rowCount: number;
  columnCount: number;
}

export interface ProcessedFile {
  blob: Blob;
  filename: string;
  mimeType: string;
  size: number;
  generatedAt: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
