/**
 * Generate large CSV datasets for performance testing
 * Target sizes: 1MB, 10MB, 50MB
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testDataDir = path.join(__dirname, '..', 'test-data');

// Ensure test-data directory exists
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomEmail() {
  return `${generateRandomString(8)}@${generateRandomString(6)}.com`;
}

function generateRandomPhone() {
  return `555-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateLargeDataset(targetSizeMB, filename) {
  const targetBytes = targetSizeMB * 1024 * 1024;
  const filePath = path.join(testDataDir, filename);

  const header = 'First Name,Last Name,Email,Mobile,Department\n';
  fs.writeFileSync(filePath, header);

  let currentSize = header.length;
  let rowCount = 0;

  while (currentSize < targetBytes) {
    const row = `${generateRandomString(6)},${generateRandomString(8)},${generateRandomEmail()},${generateRandomPhone()},${generateRandomString(10)}\n`;
    fs.appendFileSync(filePath, row);
    currentSize += row.length;
    rowCount++;

    if (rowCount % 10000 === 0) {
      console.log(`Generated ${rowCount.toLocaleString()} rows, ${(currentSize / 1024 / 1024).toFixed(2)} MB`);
    }
  }

  const finalSizeMB = (currentSize / 1024 / 1024).toFixed(2);
  console.log(`✓ Created ${filename}: ${finalSizeMB} MB (${rowCount.toLocaleString()} rows)`);
}

// Generate datasets
console.log('Generating large datasets for performance testing...\n');

generateLargeDataset(1, 'perf-1mb.csv');
generateLargeDataset(10, 'perf-10mb.csv');
generateLargeDataset(50, 'perf-50mb.csv');

console.log('\n✅ All performance datasets generated successfully');
