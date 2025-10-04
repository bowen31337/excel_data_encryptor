/**
 * Validation Utilities
 * File size and type validation
 * Based on contracts/encryption-service.contract.ts
 */

import type { ValidationResult } from '../types/file.types';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

const SUPPORTED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];

const SUPPORTED_EXTENSIONS = ['.csv', '.xls', '.xlsx'];

/**
 * Validate file size (must be ≤ 100MB)
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size <= MAX_FILE_SIZE) {
    return {
      isValid: true,
      errors: [],
    };
  }

  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);

  return {
    isValid: false,
    errors: [
      `File size exceeds 100MB limit. Your file is ${fileSizeMB}MB. Please upload a smaller file.`,
    ],
  };
}

/**
 * Validate file type (must be CSV or Excel)
 */
export function validateFileType(file: File): ValidationResult {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  // Check MIME type
  if (SUPPORTED_MIME_TYPES.includes(mimeType)) {
    return {
      isValid: true,
      errors: [],
    };
  }

  // Check file extension as fallback
  const hasValidExtension = SUPPORTED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  if (hasValidExtension) {
    return {
      isValid: true,
      errors: [],
    };
  }

  // Get file extension for error message
  const lastDotIndex = fileName.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : 'unknown';

  return {
    isValid: false,
    errors: [
      `Please upload a valid Excel (.xlsx, .xls) or CSV file. File type '${extension}' is not supported.`,
    ],
  };
}

/**
 * Validate file (combines size and type validation)
 */
export function validateFile(file: File): ValidationResult {
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  const typeValidation = validateFileType(file);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  return {
    isValid: true,
    errors: [],
  };
}
