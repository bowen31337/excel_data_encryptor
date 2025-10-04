/**
 * Type definitions for encryption-related entities
 * Based on data-model.md
 */

import type { ParsedData, ProcessedFile } from './file.types';

export enum TargetColumnType {
  FirstName = 'FIRST_NAME',
  LastName = 'LAST_NAME',
  Mobile = 'MOBILE',
  Email = 'EMAIL',
  Phone = 'PHONE',
}

export interface ColumnMapping {
  originalName: string;
  normalizedName: string;
  isTarget: boolean;
  targetType?: TargetColumnType;
  columnIndex: number;
}

export interface EncryptionStats {
  totalRows: number;
  encryptedCells: number;
  emptyCellsSkipped: number;
  targetColumnsFound: string[];
  processingTimeMs: number;
}

export interface EncryptionResult {
  success: boolean;
  message: string;
  processedData?: ParsedData;
  stats: EncryptionStats;
  errors?: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PARSING = 'PARSING',
  READY = 'READY',
  ENCRYPTING = 'ENCRYPTING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface AppStateData {
  currentState: AppState;
  uploadedFile?: {
    file: File;
    name: string;
    size: number;
    type: string;
  };
  parsedData?: ParsedData;
  columnMappings?: ColumnMapping[];
  encryptionResult?: EncryptionResult;
  processedFile?: ProcessedFile;
  progress?: number;
  errorMessage?: string;
}

export type StateAction =
  | { type: 'FILE_SELECTED'; payload: File }
  | { type: 'FILE_PARSED'; payload: ParsedData }
  | { type: 'COLUMNS_MAPPED'; payload: ColumnMapping[] }
  | { type: 'ENCRYPTION_STARTED' }
  | { type: 'ENCRYPTION_PROGRESS'; payload: number }
  | { type: 'ENCRYPTION_COMPLETE'; payload: ProcessedFile }
  | { type: 'ERROR_OCCURRED'; payload: string }
  | { type: 'RESET' };
