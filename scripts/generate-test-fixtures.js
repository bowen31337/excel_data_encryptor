#!/usr/bin/env node
/**
 * Generate test fixtures for integration and E2E tests
 */

import XLSX from 'xlsx';
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

// T038: employees-exact.xlsx - Exact column names
function createEmployeesExact() {
  const data = [
    ['First Name', 'Last Name', 'Email', 'Mobile', 'Department'],
    ['Alice', 'Johnson', 'alice.johnson@company.com', '555-0101', 'Engineering'],
    ['Bob', 'Smith', 'bob.smith@company.com', '555-0102', 'Sales']
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');

  const filePath = path.join(testDataDir, 'employees-exact.xlsx');
  XLSX.writeFile(wb, filePath);
  console.log('✅ Created employees-exact.xlsx');
}

// T040: incomplete-data.xlsx - Rows with empty cells in target columns
function createIncompleteData() {
  const data = [
    ['First Name', 'Last Name', 'Email', 'Mobile', 'Department'],
    ['Frank', 'Miller', 'frank@test.com', '555-0301', 'Engineering'],
    ['Grace', '', 'grace@test.com', '', 'Marketing'],
    ['', 'Taylor', '', '555-0303', 'Sales']
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  const filePath = path.join(testDataDir, 'incomplete-data.xlsx');
  XLSX.writeFile(wb, filePath);
  console.log('✅ Created incomplete-data.xlsx');
}

// Run all generators
console.log('Generating test fixtures...\n');
createEmployeesExact();
createIncompleteData();
console.log('\n✅ All test fixtures created successfully');
