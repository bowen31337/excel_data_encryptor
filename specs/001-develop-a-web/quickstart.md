# Quickstart Test Scenarios: Excel Data Encryptor

**Date**: 2025-10-02
**Feature**: 001-develop-a-web
**Purpose**: Manual and automated integration test scenarios

## Overview

These scenarios validate end-to-end user workflows and serve as acceptance criteria. Each scenario should be:
1. Executable as a manual test
2. Automatable as an E2E test (Playwright)
3. Used to verify the implementation meets spec requirements

---

## Scenario 1: Upload Excel with Exact Column Names

**Goal**: Verify basic Excel encryption with exact column name matches.

### Prerequisites
- Test file: `test-data/employees-exact.xlsx`
- Contents:
  | First Name | Last Name | Email | Mobile | Department |
  |------------|-----------|-------|--------|------------|
  | John | Doe | john@example.com | 555-1234 | Engineering |
  | Jane | Smith | jane@example.com | 555-5678 | Marketing |

### Steps
1. Open the application in browser
2. Drag and drop `employees-exact.xlsx` onto upload area
3. Verify file info displays:
   - File name: "employees-exact.xlsx"
   - File size: "~5 KB"
   - Estimated rows: "2 rows"
4. Click "Encrypt & Download" button
5. Wait for processing to complete (progress bar should appear)
6. Verify download starts automatically
7. Verify downloaded filename: `employees-exact_[TODAY]_encrypted.xlsx`

### Expected Results
- Processing completes in <2 seconds (file is small)
- Success notification: "File encrypted successfully! 2 rows processed, 8 cells encrypted."
- Downloaded file can be opened in Excel
- Downloaded file contents:
  | First Name | Last Name | Email | Mobile | Department |
  |------------|-----------|-------|--------|------------|
  | [64-char hash] | [64-char hash] | [64-char hash] | [64-char hash] | Engineering |
  | [64-char hash] | [64-char hash] | [64-char hash] | [64-char hash] | Marketing |
- "Department" column unchanged
- All hashes are 64 characters long (SHA-256 hex)
- Same input values produce same hashes (deterministic)

### Automated Test (Playwright)
```typescript
test('Scenario 1: Excel with exact column names', async ({ page }) => {
  await page.goto('/');

  const fileChooser = page.waitForEvent('filechooser');
  await page.locator('[data-testid="upload-area"]').click();
  await (await fileChooser).setFiles('test-data/employees-exact.xlsx');

  await expect(page.locator('[data-testid="file-name"]')).toHaveText('employees-exact.xlsx');
  await expect(page.locator('[data-testid="file-size"]')).toContainText('KB');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-testid="encrypt-button"]').click();

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/employees-exact_\d{4}-\d{2}-\d{2}_encrypted\.xlsx/);

  await expect(page.locator('.ant-notification-success')).toBeVisible();
});
```

---

## Scenario 2: Upload CSV with Fuzzy Column Names

**Goal**: Verify fuzzy column matching works for common variations.

### Prerequisites
- Test file: `test-data/contacts-fuzzy.csv`
- Contents:
  ```csv
  ID,FirstName,Last_Name,Email Address,Mobile Number,Company
  1,Alice,Johnson,alice@test.com,555-1111,Acme Corp
  2,Bob,Williams,bob@test.com,555-2222,Beta Inc
  3,Carol,Brown,carol@test.com,555-3333,Gamma LLC
  ```

### Steps
1. Open application
2. Click upload area to browse files
3. Select `contacts-fuzzy.csv`
4. Verify file info shows "3 rows"
5. Click "Encrypt & Download"
6. Verify progress indicator appears
7. Wait for download

### Expected Results
- Processing completes in <2 seconds
- Downloaded file: `contacts-fuzzy_[TODAY]_encrypted.csv`
- Fuzzy matching recognizes:
  - "FirstName" → matches "First Name"
  - "Last_Name" → matches "Last Name"
  - "Email Address" → matches "Email"
  - "Mobile Number" → matches "Mobile"
- CSV contents after encryption:
  ```csv
  ID,FirstName,Last_Name,Email Address,Mobile Number,Company
  1,[hash],[hash],[hash],[hash],Acme Corp
  2,[hash],[hash],[hash],[hash],Beta Inc
  3,[hash],[hash],[hash],[hash],Gamma LLC
  ```
- ID and Company columns unchanged

### Automated Test
```typescript
test('Scenario 2: CSV with fuzzy column names', async ({ page }) => {
  await page.goto('/');

  await page.locator('input[type="file"]').setInputFiles('test-data/contacts-fuzzy.csv');

  await expect(page.locator('[data-testid="file-name"]')).toHaveText('contacts-fuzzy.csv');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-testid="encrypt-button"]').click();
  const download = await downloadPromise;

  const path = await download.path();
  const content = await fs.readFile(path, 'utf-8');

  // Verify ID and Company are unchanged
  expect(content).toContain('Acme Corp');
  expect(content).toContain('Beta Inc');

  // Verify target columns are hashed (64 hex chars)
  const hashPattern = /[0-9a-f]{64}/g;
  const hashes = content.match(hashPattern);
  expect(hashes).toHaveLength(12); // 4 columns × 3 rows
});
```

---

## Scenario 3: Upload File with Empty Cells

**Goal**: Verify empty cells remain empty (not hashed).

### Prerequisites
- Test file: `test-data/incomplete-data.xlsx`
- Contents:
  | First Name | Last Name | Email | Mobile |
  |------------|-----------|-------|--------|
  | David | Lee | david@test.com | |
  | | Chen | emma@test.com | 555-4444 |
  | Frank | | | 555-5555 |

### Steps
1. Open application
2. Upload `incomplete-data.xlsx`
3. Click "Encrypt & Download"
4. Download and open encrypted file

### Expected Results
- Downloaded file: `incomplete-data_[TODAY]_encrypted.xlsx`
- Empty cells remain empty:
  | First Name | Last Name | Email | Mobile |
  |------------|-----------|-------|--------|
  | [hash] | [hash] | [hash] | **(empty)** |
  | **(empty)** | [hash] | [hash] | [hash] |
  | [hash] | **(empty)** | **(empty)** | [hash] |
- Only non-empty cells are hashed
- Success message: "3 rows processed, 7 cells encrypted, 5 empty cells skipped."

### Automated Test
```typescript
test('Scenario 3: Empty cells remain empty', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles('test-data/incomplete-data.xlsx');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-testid="encrypt-button"]').click();
  const download = await downloadPromise;

  await expect(page.locator('.ant-notification-success')).toContainText('7 cells encrypted');
  await expect(page.locator('.ant-notification-success')).toContainText('5 empty cells skipped');
});
```

---

## Scenario 4: Upload File Without Target Columns

**Goal**: Verify error handling when no target columns found.

### Prerequisites
- Test file: `test-data/no-targets.csv`
- Contents:
  ```csv
  ID,Product,Price,Quantity
  1,Widget,9.99,100
  2,Gadget,19.99,50
  ```

### Steps
1. Open application
2. Upload `no-targets.csv`
3. Attempt to click "Encrypt & Download"

### Expected Results
- File parses successfully
- Error notification appears immediately:
  - **Title**: "No Target Columns Found"
  - **Message**: "File must contain at least one of these columns: First Name, Last Name, Mobile, Email (or variations like FirstName, E-mail, etc.)"
  - **Duration**: 6 seconds
  - **Type**: Error (red)
- "Encrypt & Download" button is disabled
- User can dismiss error and upload a different file

### Automated Test
```typescript
test('Scenario 4: No target columns error', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles('test-data/no-targets.csv');

  await expect(page.locator('.ant-notification-error')).toBeVisible();
  await expect(page.locator('.ant-notification-error')).toContainText('No Target Columns Found');

  await expect(page.locator('[data-testid="encrypt-button"]')).toBeDisabled();
});
```

---

## Scenario 5: Upload Large File (50MB)

**Goal**: Verify performance and UI responsiveness with large files.

### Prerequisites
- Test file: `test-data/large-dataset.csv` (50MB, ~500k rows)
- Generate with script:
  ```bash
  node generate-test-data.js --rows 500000 --output large-dataset.csv
  ```

### Steps
1. Open application
2. Upload `large-dataset.csv` (50MB)
3. Observe UI during upload and processing
4. Click "Encrypt & Download"
5. Monitor progress bar
6. Wait for completion

### Expected Results
- **Upload phase**: <5 seconds, spinner visible
- **Parsing phase**: <10 seconds, progress indicator
- **Encryption phase**: <25 seconds (500ms/MB × 50MB target)
- **Total time**: <40 seconds
- **UI responsiveness**:
  - Browser does not freeze
  - Progress bar updates smoothly (at least every 2 seconds)
  - User can see percentage (e.g., "45% - Processing row 225,000 / 500,000")
- **Success notification**: "500,000 rows processed"
- Downloaded file size similar to original (~50MB)

### Performance Assertions
- Processing rate ≥2MB/s (50MB in 25s)
- No JavaScript errors or warnings in console
- Memory usage <1GB (check DevTools Performance tab)
- Page remains interactive (can click UI elements during processing)

### Automated Test
```typescript
test('Scenario 5: Large file performance', async ({ page }) => {
  await page.goto('/');

  const startTime = Date.now();

  await page.locator('input[type="file"]').setInputFiles('test-data/large-dataset.csv');

  await expect(page.locator('[data-testid="file-size"]')).toContainText('50');

  await page.locator('[data-testid="encrypt-button"]').click();

  // Progress bar should appear
  await expect(page.locator('.ant-progress')).toBeVisible({ timeout: 2000 });

  // Wait for completion (up to 60s timeout)
  const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
  const download = await downloadPromise;

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  // Assert performance target
  expect(duration).toBeLessThan(40); // 40 seconds max

  await expect(page.locator('.ant-notification-success')).toContainText('500,000 rows');
});
```

---

## Scenario 6: Unsupported File Format

**Goal**: Verify error handling for unsupported file types.

### Prerequisites
- Test file: `test-data/document.pdf` (any PDF file)

### Steps
1. Open application
2. Attempt to upload `document.pdf`

### Expected Results
- Error notification appears immediately:
  - **Title**: "Unsupported File Format"
  - **Message**: "Please upload a valid Excel (.xlsx, .xls) or CSV file. File type '.pdf' is not supported."
- File is rejected (no file info shown)
- Upload area remains in idle state

### Automated Test
```typescript
test('Scenario 6: Unsupported file format', async ({ page }) => {
  await page.goto('/');

  await page.locator('input[type="file"]').setInputFiles('test-data/document.pdf');

  await expect(page.locator('.ant-notification-error')).toBeVisible();
  await expect(page.locator('.ant-notification-error')).toContainText('Unsupported File Format');
  await expect(page.locator('.ant-notification-error')).toContainText('.pdf');

  // No file info displayed
  await expect(page.locator('[data-testid="file-name"]')).not.toBeVisible();
});
```

---

## Scenario 7: File Too Large (>100MB)

**Goal**: Verify file size validation.

### Prerequisites
- Test file: `test-data/huge-file.csv` (101MB)

### Steps
1. Open application
2. Attempt to upload `huge-file.csv`

### Expected Results
- Error notification:
  - **Title**: "File Too Large"
  - **Message**: "File size exceeds 100MB limit. Your file is 101MB. Please upload a smaller file."
- File is rejected

### Automated Test
```typescript
test('Scenario 7: File size limit', async ({ page }) => {
  await page.goto('/');

  await page.locator('input[type="file"]').setInputFiles('test-data/huge-file.csv');

  await expect(page.locator('.ant-notification-error')).toContainText('File Too Large');
  await expect(page.locator('.ant-notification-error')).toContainText('100MB');
});
```

---

## Scenario 8: Excel Multi-Sheet (First Sheet Only)

**Goal**: Verify only first sheet is processed.

### Prerequisites
- Test file: `test-data/multi-sheet.xlsx`
- Sheet 1 "Employees": Has target columns (First Name, Email)
- Sheet 2 "Products": No target columns
- Sheet 3 "Sales": Has target columns but should be ignored

### Steps
1. Open application
2. Upload `multi-sheet.xlsx`
3. Verify file info shows sheet name: "Sheet: Employees"
4. Click "Encrypt & Download"
5. Open downloaded file in Excel

### Expected Results
- Only Sheet 1 is present in downloaded file
- Sheets 2 and 3 are not included
- Target columns in Sheet 1 are encrypted
- Success message: "Sheet 'Employees' processed"

### Automated Test
```typescript
test('Scenario 8: Multi-sheet Excel', async ({ page }) => {
  await page.goto('/');

  await page.locator('input[type="file"]').setInputFiles('test-data/multi-sheet.xlsx');

  await expect(page.locator('[data-testid="sheet-name"]')).toContainText('Employees');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-testid="encrypt-button"]').click();
  const download = await downloadPromise;

  await expect(page.locator('.ant-notification-success')).toContainText('Employees');
});
```

---

## Test Data Generation

Create test data files using this Node.js script:

```javascript
// generate-test-data.js
const fs = require('fs');
const XLSX = require('xlsx');

function generateTestData(rows, filename, format = 'csv') {
  const headers = ['First Name', 'Last Name', 'Email', 'Mobile', 'Department'];
  const data = [headers];

  const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana'];
  const lastNames = ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Davis'];
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];

  for (let i = 0; i < rows; i++) {
    data.push([
      firstNames[i % firstNames.length],
      lastNames[i % lastNames.length],
      `user${i}@example.com`,
      `555-${String(i).padStart(4, '0')}`,
      departments[i % departments.length],
    ]);
  }

  if (format === 'csv') {
    const csv = data.map(row => row.join(',')).join('\n');
    fs.writeFileSync(filename, csv);
  } else if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename);
  }

  console.log(`Generated ${filename} with ${rows} rows`);
}

// Usage
generateTestData(2, 'test-data/employees-exact.xlsx', 'xlsx');
generateTestData(3, 'test-data/contacts-fuzzy.csv', 'csv');
generateTestData(500000, 'test-data/large-dataset.csv', 'csv');
```

---

## Execution Summary

**Manual Testing**: Run scenarios 1-8 in order, verify expected results
**Automated Testing**: Run `npm run test:e2e` to execute all Playwright tests
**Performance Testing**: Focus on Scenario 5, measure with Chrome DevTools
**Acceptance Criteria**: All 8 scenarios must pass for feature to be considered complete

---

**Next**: Create `tasks.md` with `/tasks` command
