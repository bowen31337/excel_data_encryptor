/**
 * Contract tests for validation utilities
 * These tests MUST fail until validation.ts is implemented
 * Based on contracts/encryption-service.contract.ts
 */

import { describe, expect, it } from 'vitest';

// Import validators (will fail until implemented)
import { validateFileSize, validateFileType } from '../../src/utils/validation';

describe('validation - validateFileSize', () => {
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB

  it('should accept files under 100MB', () => {
    const file = new File(['a'.repeat(50 * 1024 * 1024)], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = validateFileSize(file);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept files exactly 100MB', () => {
    const file = new File(['a'.repeat(MAX_SIZE)], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = validateFileSize(file);

    expect(result.isValid).toBe(true);
  });

  it('should reject files over 100MB', () => {
    const file = new File(['a'.repeat(MAX_SIZE + 1)], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = validateFileSize(file);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('100MB');
  });

  it('should include file size in error message', () => {
    const file = new File(['a'.repeat(MAX_SIZE + 1024)], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = validateFileSize(file);

    expect(result.errors[0]).toMatch(/\d+\s*MB/);
  });

  it('should accept very small files', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });

    const result = validateFileSize(file);

    expect(result.isValid).toBe(true);
  });
});

describe('validation - validateFileType', () => {
  it('should accept .xlsx files', () => {
    const file = new File([''], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = validateFileType(file);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept .xls files', () => {
    const file = new File([''], 'test.xls', {
      type: 'application/vnd.ms-excel',
    });

    const result = validateFileType(file);

    expect(result.isValid).toBe(true);
  });

  it('should accept .csv files', () => {
    const file = new File([''], 'test.csv', { type: 'text/csv' });

    const result = validateFileType(file);

    expect(result.isValid).toBe(true);
  });

  it('should reject PDF files', () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });

    const result = validateFileType(file);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('.pdf');
  });

  it('should reject unsupported file types', () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' });

    const result = validateFileType(file);

    expect(result.isValid).toBe(false);
  });

  it('should provide actionable error message', () => {
    const file = new File([''], 'test.doc', {
      type: 'application/msword',
    });

    const result = validateFileType(file);

    expect(result.errors[0]).toContain('Excel');
    expect(result.errors[0]).toContain('CSV');
  });

  it('should handle files with no extension', () => {
    const file = new File([''], 'test', { type: 'application/octet-stream' });

    const result = validateFileType(file);

    expect(result.isValid).toBe(false);
  });

  it('should be case-insensitive for file extensions', () => {
    const file1 = new File([''], 'test.XLSX', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const file2 = new File([''], 'test.Csv', { type: 'text/csv' });

    expect(validateFileType(file1).isValid).toBe(true);
    expect(validateFileType(file2).isValid).toBe(true);
  });
});
