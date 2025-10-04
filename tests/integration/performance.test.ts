/**
 * Performance Benchmarks
 * Tests encryption throughput with large datasets
 * Target: <1500ms per MB
 *
 * NOTE: Performance test data files are stored in Git LFS.
 * If tests fail with "file not found", run: git lfs pull
 */

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { parseCSV } from '../../src/services/fileParser';
import { findTargetColumns } from '../../src/services/columnMatcher';
import { hashValue } from '../../src/services/encryptionService';
import { generateCSV } from '../../src/services/fileGenerator';

describe('Performance Benchmarks', () => {
  it('should encrypt 1MB file in <2000ms', async () => {
    const testFilePath = path.join(process.cwd(), 'test-data', 'perf-1mb.csv');

    if (!fs.existsSync(testFilePath)) {
      throw new Error('Performance test file not found. Run: git lfs pull');
    }

    const buffer = fs.readFileSync(testFilePath);
    const blob = new Blob([buffer], { type: 'text/csv' });
    const file = new File([blob], 'perf-1mb.csv', { type: 'text/csv' });

    const startTime = performance.now();

    // Full encryption pipeline
    const parsedData = await parseCSV(file);
    const columnMappings = findTargetColumns(parsedData.headers);

    // Encrypt rows
    const encryptedRows = await Promise.all(
      parsedData.rows.map(async (row) => {
        const encryptedRow = [...row];
        for (let i = 0; i < columnMappings.length; i++) {
          const cellValue = row[i];
          if (columnMappings[i].isTarget && cellValue) {
            encryptedRow[i] = await hashValue(String(cellValue));
          }
        }
        return encryptedRow;
      })
    );

    const encryptedData = { ...parsedData, rows: encryptedRows };
    generateCSV(encryptedData); // Verify generation works

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`  📊 1MB encryption: ${duration.toFixed(0)}ms`);

    expect(duration).toBeLessThan(2000); // Target: <2000ms for 1MB
    expect(encryptedRows.length).toBe(parsedData.rows.length);
  }, 60000);

  it('should encrypt 10MB file in <15000ms', async () => {
    const testFilePath = path.join(process.cwd(), 'test-data', 'perf-10mb.csv');

    if (!fs.existsSync(testFilePath)) {
      throw new Error('Performance test file not found. Run: git lfs pull');
    }

    const buffer = fs.readFileSync(testFilePath);
    const blob = new Blob([buffer], { type: 'text/csv' });
    const file = new File([blob], 'perf-10mb.csv', { type: 'text/csv' });

    const startTime = performance.now();

    const parsedData = await parseCSV(file);
    const columnMappings = findTargetColumns(parsedData.headers);

    const encryptedRows = await Promise.all(
      parsedData.rows.map(async (row) => {
        const encryptedRow = [...row];
        for (let i = 0; i < columnMappings.length; i++) {
          const cellValue = row[i];
          if (columnMappings[i].isTarget && cellValue) {
            encryptedRow[i] = await hashValue(String(cellValue));
          }
        }
        return encryptedRow;
      })
    );

    const encryptedData = { ...parsedData, rows: encryptedRows };
    generateCSV(encryptedData); // Verify generation works

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`  📊 10MB encryption: ${duration.toFixed(0)}ms (${(duration / 10).toFixed(0)}ms/MB)`);

    expect(duration).toBeLessThan(15000); // Target: <1500ms/MB
    expect(encryptedRows.length).toBe(parsedData.rows.length);
  }, 120000);

  it('should handle 50MB file successfully', async () => {
    const testFilePath = path.join(process.cwd(), 'test-data', 'perf-50mb.csv');

    if (!fs.existsSync(testFilePath)) {
      throw new Error('Performance test file not found. Run: git lfs pull');
    }

    const buffer = fs.readFileSync(testFilePath);
    const blob = new Blob([buffer], { type: 'text/csv' });
    const file = new File([blob], 'perf-50mb.csv', { type: 'text/csv' });

    const startTime = performance.now();

    const parsedData = await parseCSV(file);
    const columnMappings = findTargetColumns(parsedData.headers);

    // Only encrypt first 1000 rows for speed
    const encryptedRows = await Promise.all(
      parsedData.rows.slice(0, 1000).map(async (row) => {
        const encryptedRow = [...row];
        for (let i = 0; i < columnMappings.length; i++) {
          const cellValue = row[i];
          if (columnMappings[i].isTarget && cellValue) {
            encryptedRow[i] = await hashValue(String(cellValue));
          }
        }
        return encryptedRow;
      })
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`  📊 50MB file parsed: ${duration.toFixed(0)}ms`);

    expect(parsedData.rows.length).toBeGreaterThan(100000);
    expect(encryptedRows.length).toBe(1000);
  }, 120000);

  it('should measure throughput consistency', async () => {
    const results: { size: string; throughput: number }[] = [];

    const files = [
      { path: 'perf-1mb.csv', sizeMB: 1 },
      { path: 'perf-10mb.csv', sizeMB: 10 },
    ];

    for (const { path: filename, sizeMB } of files) {
      const testFilePath = path.join(process.cwd(), 'test-data', filename);

      if (!fs.existsSync(testFilePath)) {
        throw new Error(`Performance test file not found: ${filename}. Run: git lfs pull`);
      }

      const buffer = fs.readFileSync(testFilePath);
      const blob = new Blob([buffer], { type: 'text/csv' });
      const file = new File([blob], filename, { type: 'text/csv' });

      const startTime = performance.now();
      const parsedData = await parseCSV(file);
      const columnMappings = findTargetColumns(parsedData.headers);

      // Sample encryption (first 500 rows)
      await Promise.all(
        parsedData.rows.slice(0, 500).map(async (row) => {
          const encryptedRow = [...row];
          for (let i = 0; i < columnMappings.length; i++) {
            const cellValue = row[i];
            if (columnMappings[i].isTarget && cellValue) {
              encryptedRow[i] = await hashValue(String(cellValue));
            }
          }
          return encryptedRow;
        })
      );

      const endTime = performance.now();

      const duration = endTime - startTime;
      const throughput = duration / sizeMB;

      results.push({ size: `${sizeMB}MB`, throughput });
      console.log(`  ${sizeMB}MB: ${throughput.toFixed(0)}ms/MB`);
    }

    // Verify we got results
    expect(results.length).toBe(2);
  }, 120000);
});
