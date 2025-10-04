# Quickstart Test Scenarios: Mobile & Phone Column Enhancements

**Date**: 2025-10-04
**Feature**: 002-it-has-to
**Purpose**: Manual and automated integration test scenarios for mobile UI, Phone column, and single-file build

## Overview

These scenarios validate the four enhancement areas:
1. Mobile-responsive UI (320px-768px viewports)
2. Phone column encryption (fuzzy matching)
3. Value normalization (trim + lowercase for digital marketing)
4. Single-file HTML build (offline capable)

Each scenario is:
1. Executable as a manual test
2. Automatable as an E2E test (Playwright with mobile emulation)
3. Used to verify implementation meets spec requirements

---

## Scenario 1: Mobile Upload on iPhone (375px viewport)

**Goal**: Verify mobile-responsive UI works on small screen (iPhone SE/8 size).

### Prerequisites
- Test file: `test-data/employees-exact.xlsx` (from 001-develop-a-web)
- Mobile device emulation: iPhone SE (375×667px)
- Browser: Safari iOS 14+ or Chrome DevTools iPhone emulation

### Steps
1. Open application in browser with 375px viewport width
2. Verify UI elements are visible without horizontal scrolling:
   - Header with lock icon fits on screen
   - Upload button/area is visible and accessible
   - No text truncation or overlapping elements
3. Tap file upload area (should open native file picker on mobile)
4. Select `employees-exact.xlsx` from file picker
5. Verify file info displays in vertical layout:
   - File name visible
   - File size visible
   - Row count visible
   - Detected columns list readable
6. Tap "Encrypt & Download" button (verify button is ≥44px tall)
7. Observe progress indicator (should be clearly visible on small screen)
8. Wait for encryption to complete
9. Verify file downloads automatically

### Expected Results
- All UI elements fit within 375px width (no horizontal scroll)
- Touch targets are ≥44px × 44px (buttons, file picker)
- Text is readable at mobile font sizes (≥14px body text)
- Progress bar is clearly visible during processing
- Success message displays properly on small screen
- File downloads with correct name: `employees-exact_[YYYY-MM-DD]_encrypted.xlsx`

### Automated Test (Playwright)
```typescript
test('Scenario 1: Mobile upload on iPhone', async ({ page }) => {
  // Emulate iPhone SE
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/');

  // Verify no horizontal scroll
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(375);

  // Upload file via file picker (not drag-drop on mobile)
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('test-data/employees-exact.xlsx');

  // Verify file info visible
  await expect(page.locator('[data-testid="file-name"]')).toBeVisible();
  await expect(page.locator('[data-testid="file-size"]')).toBeVisible();

  // Verify button height ≥44px
  const buttonHeight = await page.locator('[data-testid="encrypt-button"]').evaluate(el => el.clientHeight);
  expect(buttonHeight).toBeGreaterThanOrEqual(44);

  // Encrypt and download
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-testid="encrypt-button"]').click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/employees-exact_\d{4}-\d{2}-\d{2}_encrypted\.xlsx/);
});
```

---

## Scenario 2: Tablet Orientation Change (iPad)

**Goal**: Verify UI adapts when device rotates from portrait to landscape.

### Prerequisites
- Test file: `test-data/contacts-fuzzy.csv` (from 001-develop-a-web)
- Device emulation: iPad (768×1024px portrait, 1024×768px landscape)
- Browser: Safari iOS 14+ or Chrome DevTools iPad emulation

### Steps
1. Open application in portrait mode (768×1024px)
2. Upload `contacts-fuzzy.csv` via file picker
3. Verify file info displays correctly in portrait layout
4. **Rotate device to landscape** (1024×768px)
5. Verify:
   - Layout adjusts without page reload
   - File upload state is preserved (file still uploaded)
   - File info remains visible
   - No data loss occurred
6. Click "Encrypt & Download" in landscape mode
7. **Rotate back to portrait** during encryption
8. Verify progress indicator updates correctly in portrait

### Expected Results
- UI adapts smoothly to orientation changes (no flash of unstyled content)
- File upload state persists through rotation (no re-upload needed)
- Progress indicator continues without interruption
- Layout uses available space efficiently in both orientations:
  - Portrait: Vertical stacking
  - Landscape: Horizontal layout where space allows
- Encryption completes successfully regardless of orientation changes

### Automated Test (Playwright)
```typescript
test('Scenario 2: Tablet orientation change', async ({ page }) => {
  // Start in portrait
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');

  // Upload file
  await page.locator('input[type="file"]').setInputFiles('test-data/contacts-fuzzy.csv');
  await expect(page.locator('[data-testid="file-name"]')).toContainText('contacts-fuzzy.csv');

  // Rotate to landscape
  await page.setViewportSize({ width: 1024, height: 768 });

  // Verify file info still visible (state persisted)
  await expect(page.locator('[data-testid="file-name"]')).toContainText('contacts-fuzzy.csv');

  // Start encryption
  await page.locator('[data-testid="encrypt-button"]').click();

  // Rotate back to portrait during processing
  await page.setViewportSize({ width: 768, height: 1024 });

  // Wait for completion
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toMatch(/contacts-fuzzy_.*_encrypted\.csv/);
});
```

---

## Scenario 3: Phone Column Detection (Fuzzy Matching)

**Goal**: Verify "Phone" column variations are recognized and encrypted.

### Prerequisites
- Create test file: `test-data/contacts-with-phone.csv`
  ```csv
  ID,Name,Email,Phone Number,Address
  1,Alice,alice@test.com,555-1234,123 Main St
  2,Bob,bob@test.com,555-5678,456 Oak Ave
  3,Carol,carol@test.com,,789 Elm St
  ```

### Steps
1. Open application
2. Upload `contacts-with-phone.csv`
3. Verify file info shows detected columns:
   - Should list: "Email, Phone Number"
   - Should NOT list: "ID, Name, Address" (not target columns)
4. Click "Encrypt & Download"
5. Download and inspect encrypted CSV
6. Verify:
   - "Email" column is hashed (both rows)
   - "Phone Number" column is hashed (rows 1-2)
   - Row 3 "Phone Number" is empty (not hashed)
   - "ID", "Name", "Address" unchanged

### Expected Results
- Phone Number recognized as target column ✅
- Empty phone cell (row 3) remains empty ✅
- Both Email and Phone Number encrypted ✅
- Non-target columns unchanged ✅
- Success message: "3 rows processed, 4 cells encrypted, 1 empty cell skipped."

### Test Variations

**Variation A**: `phone` (lowercase)
```csv
name,email,phone,department
John,john@test.com,555-1234,Sales
```
**Expected**: Phone column detected ✅

**Variation B**: `phone_number` (underscore)
```csv
first_name,last_name,phone_number
Alice,Johnson,555-9999
```
**Expected**: Phone number column detected ✅

**Variation C**: `PHONE` (uppercase)
```csv
NAME,EMAIL,PHONE,TITLE
Bob,bob@corp.com,555-0000,Manager
```
**Expected**: PHONE column detected ✅

**Variation D**: Both Mobile and Phone columns
```csv
Name,Mobile,Email,Phone
Alice,555-1111,alice@test.com,555-2222
```
**Expected**: Both Mobile AND Phone columns encrypted (4 hashed cells) ✅

### Automated Test (Playwright)
```typescript
test('Scenario 3: Phone column detection', async ({ page }) => {
  await page.goto('/');

  // Create test file with Phone Number column
  const csvContent = `ID,Name,Email,Phone Number,Address
1,Alice,alice@test.com,555-1234,123 Main St
2,Bob,bob@test.com,555-5678,456 Oak Ave
3,Carol,carol@test.com,,789 Elm St`;

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const file = new File([blob], 'contacts-with-phone.csv', { type: 'text/csv' });

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles([file]);

  // Verify Phone Number is detected
  await expect(page.locator('[data-testid="detected-columns"]')).toContainText('Phone Number');

  // Encrypt
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-testid="encrypt-button"]').click();
  const download = await downloadPromise;

  // Verify success message mentions encrypted cells
  await expect(page.locator('.ant-notification-success')).toContainText('4 cells encrypted');
  await expect(page.locator('.ant-notification-success')).toContainText('1 empty cell skipped');
});
```

---

## Scenario 4: Value Normalization (Trim + Lowercase)

**Goal**: Verify all target column values are normalized (trimmed and lowercased) before SHA-256 hashing for digital marketing consistency.

### Prerequisites
- Create test file: `test-data/normalization-test.csv`
  ```csv
  FirstName,LastName,Email,Mobile
  "  JOHN  ","  DOE  ","  JOHN.DOE@EXAMPLE.COM  ","  555-1234  "
  "JANE","SMITH","JANE@TEST.COM","555-5678"
  "alice","johnson","alice@example.com","555-9999"
  "   ","Bob","  ","555-0000"
  ```

### Steps
1. Open application
2. Upload `normalization-test.csv`
3. Verify file info shows 4 target columns detected (FirstName, LastName, Email, Mobile)
4. Click "Encrypt & Download"
5. Download encrypted CSV
6. **Manual verification** (compare with expected hashes):
   - Row 1: "  JOHN  " → should produce same hash as "john"
   - Row 1: "  DOE  " → should produce same hash as "doe"
   - Row 1: "  JOHN.DOE@EXAMPLE.COM  " → should produce same hash as "john.doe@example.com"
   - Row 2: "JANE" → should produce same hash as "jane"
   - Row 3: "alice" → should produce hash of "alice" (already lowercase)
   - Row 4: "   " (whitespace-only FirstName) → should be EMPTY (not hashed)
   - Row 4: "  " (whitespace-only Email) → should be EMPTY (not hashed)

### Expected Results
- All non-empty target values trimmed before hashing ✅
- All non-empty target values converted to lowercase before hashing ✅
- Whitespace-only cells become empty (no hash) ✅
- Empty cells remain empty ✅
- Consistent hashing:
  - "  JOHN  ", "JOHN", "john" all produce identical hash
  - "  DOE  ", "DOE", "doe" all produce identical hash
  - "  JOHN.DOE@EXAMPLE.COM  ", "JOHN.DOE@EXAMPLE.COM", "john.doe@example.com" all produce identical hash
- Success message: "4 rows processed, 11 cells encrypted, 2 empty cells skipped."

### Hash Verification Example
```javascript
// Expected: These should all produce the same SHA-256 hash
const testValues = [
  "  JOHN  ",      // Input with whitespace and uppercase
  "JOHN",          // Input uppercase only
  "john",          // Already normalized
];

// All should normalize to "john" before hashing
// SHA-256("john") = "527bd5b5d689e2c32ae974c6229ff785fb86df21f6f0d35b03c5f6d32e076a03"

testValues.forEach(value => {
  const normalized = value.trim().toLowerCase();
  console.log(`"${value}" → "${normalized}"`);
  // All should output: → "john"
});
```

### Automated Test (Playwright)
```typescript
test('Scenario 4: Value normalization', async ({ page }) => {
  await page.goto('/');

  // Create test file with mixed case and whitespace
  const csvContent = `FirstName,LastName,Email,Mobile
"  JOHN  ","  DOE  ","  JOHN.DOE@EXAMPLE.COM  ","  555-1234  "
"JANE","SMITH","JANE@TEST.COM","555-5678"
"alice","johnson","alice@example.com","555-9999"
"   ","Bob","  ","555-0000"`;

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const file = new File([blob], 'normalization-test.csv', { type: 'text/csv' });

  await page.locator('input[type="file"]').setInputFiles([file]);

  // Encrypt
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-testid="encrypt-button"]').click();
  const download = await downloadPromise;

  // Read encrypted CSV
  const downloadPath = await download.path();
  const encryptedContent = await fs.readFile(downloadPath, 'utf-8');
  const rows = encryptedContent.split('\n').map(row => row.split(','));

  // Verify Row 1: "  JOHN  " should produce same hash as "john"
  const expectedJohnHash = await sha256('john');
  expect(rows[1][0]).toBe(expectedJohnHash);

  // Verify Row 2: "JANE" should produce same hash as "jane"
  const expectedJaneHash = await sha256('jane');
  expect(rows[2][0]).toBe(expectedJaneHash);

  // Verify Row 3: "alice" should produce hash of "alice"
  const expectedAliceHash = await sha256('alice');
  expect(rows[3][0]).toBe(expectedAliceHash);

  // Verify Row 4: "   " (whitespace-only) should be EMPTY
  expect(rows[4][0].trim()).toBe('');
  expect(rows[4][2].trim()).toBe(''); // Email column also whitespace-only

  // Verify success message
  await expect(page.locator('.ant-notification-success')).toContainText('11 cells encrypted');
  await expect(page.locator('.ant-notification-success')).toContainText('2 empty cells skipped');
});
```

### Cross-Verification Test
Create a second CSV with already-normalized values and verify hashes match:

**File A** (`normalization-test.csv` from above):
```csv
FirstName,LastName,Email
"  JOHN  ","  DOE  ","  JOHN.DOE@EXAMPLE.COM  "
```

**File B** (`normalized-baseline.csv`):
```csv
FirstName,LastName,Email
john,doe,john.doe@example.com
```

**Expected**: Encrypted File A row 1 should produce IDENTICAL hashes as encrypted File B row 1.

---

## Scenario 5: Single-File HTML Offline Deployment

**Goal**: Verify single-file build works offline without external dependencies.

### Prerequisites
- Build single-file HTML: `npm run build:single`
- Output: `dist/index.html` (self-contained)
- No web server required

### Steps
1. Build single-file HTML:
   ```bash
   npm run build:single
   ```
2. Verify build output shows single `index.html` file (no separate .js or .css files)
3. Check file size:
   ```bash
   ls -lh dist/index.html
   ```
   Should be <10MB (warning if exceeded)
4. Inspect `index.html` in text editor:
   - Verify CSS is in `<style>` tags (not `<link>`)
   - Verify JavaScript is in `<script>` tags (not `<script src="">`)
   - Verify no external resource URLs (cdn, googleapis, etc.)
5. **Test offline**:
   - Open `dist/index.html` directly in browser (file:// protocol)
   - OR disable network in DevTools and open via localhost
6. Upload test file and encrypt
7. Verify all functionality works:
   - File upload ✅
   - Parsing ✅
   - Column detection ✅
   - Encryption ✅
   - Download ✅

### Expected Results
- Single `index.html` file generated ✅
- File size <10MB (build warns if >10MB) ✅
- All CSS inlined in `<style>` tags ✅
- All JavaScript inlined in `<script>` tags ✅
- No external resources (`<link>`, `<script src="">`, CDN URLs) ✅
- Works offline from `file://` protocol ✅
- Full functionality preserved (no features missing) ✅

### Build Size Validation
```bash
#!/bin/bash
# build-check.sh
SIZE=$(stat -f%z dist/index.html 2>/dev/null || stat --format=%s dist/index.html 2>/dev/null)
SIZE_MB=$(echo "scale=2; $SIZE / 1024 / 1024" | bc)

if (( $(echo "$SIZE_MB > 10" | bc -l) )); then
  echo "⚠️  WARNING: Single-file build is ${SIZE_MB}MB (exceeds 10MB recommended limit)"
  exit 1
else
  echo "✅ Single-file build: ${SIZE_MB}MB"
fi
```

### Automated Test
```typescript
test('Scenario 4: Single-file HTML offline', async ({ page }) => {
  // Build single-file version
  await exec('npm run build:single');

  // Check file exists
  const htmlPath = 'dist/index.html';
  const htmlExists = await fs.pathExists(htmlPath);
  expect(htmlExists).toBe(true);

  // Verify no separate JS/CSS files
  const distFiles = await fs.readdir('dist');
  const jsFiles = distFiles.filter(f => f.endsWith('.js'));
  const cssFiles = distFiles.filter(f => f.endsWith('.css'));

  expect(jsFiles.length).toBe(0); // All JS should be inline
  expect(cssFiles.length).toBe(0); // All CSS should be inline

  // Open file directly (file:// protocol)
  await page.goto(`file://${path.resolve(htmlPath)}`);

  // Test functionality offline
  await page.locator('input[type="file"]').setInputFiles('test-data/employees-exact.xlsx');
  await expect(page.locator('[data-testid="file-name"]')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-testid="encrypt-button"]').click();
  await downloadPromise;
});
```

---

## Scenario 6: PWA Installation on Mobile

**Goal**: Verify Progressive Web App can be installed and works offline.

### Prerequisites
- Application deployed to HTTPS URL (PWA requires HTTPS)
- Mobile device (real or emulated): iOS Safari or Chrome Android
- Service worker enabled in build

### Steps
1. Open application on mobile device (Chrome Android or iOS Safari)
2. Wait for install prompt to appear (may be automatic or triggered by button)
3. Tap "Install" or "Add to Home Screen"
4. Wait for installation to complete
5. **Turn off Wi-Fi and cellular data** (airplane mode)
6. Open installed PWA from home screen
7. Upload a test file (from device storage)
8. Encrypt and download
9. Re-enable network
10. Verify app updates to latest version (service worker update)

### Expected Results
- Install prompt appears (after a few seconds on site) ✅
- App installs to home screen with custom icon ✅
- App opens in standalone mode (no browser UI) ✅
- **Offline functionality**:
  - App loads without network ✅
  - File upload works (local files) ✅
  - Encryption works (client-side) ✅
  - Download works ✅
- Service worker caches all assets ✅
- App updates automatically when back online ✅

### PWA Audit Checklist
```bash
# Run Lighthouse PWA audit
lighthouse https://your-app-url.com --view --preset=pwa

# Expected scores:
# - Installable: 100/100
# - PWA Optimized: 100/100
# - Service Worker registered: ✅
# - Offline capable: ✅
# - Manifest valid: ✅
```

### Automated Test (Playwright with Service Worker)
```typescript
test('Scenario 5: PWA installation', async ({ page, context }) => {
  await context.grantPermissions(['notifications']);

  await page.goto('/');

  // Wait for service worker registration
  await page.waitForFunction(() => 'serviceWorker' in navigator);

  const swRegistered = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration !== undefined;
  });

  expect(swRegistered).toBe(true);

  // Verify manifest exists
  const manifestLink = page.locator('link[rel="manifest"]');
  await expect(manifestLink).toHaveAttribute('href', /manifest/);

  // Test offline mode
  await context.setOffline(true);

  // Page should still load (from cache)
  await page.reload();
  await expect(page.locator('h3')).toContainText('Excel Data Encryptor');

  // Re-enable network
  await context.setOffline(false);
});
```

---

## Scenario 7: Minimum Viewport (320px) Compatibility

**Goal**: Verify app works on smallest supported mobile screen (iPhone SE 1st gen).

### Prerequisites
- Viewport: 320×568px (iPhone SE 1st generation)
- Test file: Small CSV (< 1MB)

### Steps
1. Set viewport to 320px width
2. Verify all UI elements visible:
   - Header fits within 320px
   - Upload area visible
   - Buttons not cut off
3. Upload test file
4. Verify file info displays without horizontal scroll
5. Encrypt and download

### Expected Results
- No horizontal scrolling required ✅
- All text readable (no tiny font sizes) ✅
- Touch targets ≥44px ✅
- Upload button/area accessible ✅
- Progress bar fits within 320px ✅

### Automated Test
```typescript
test('Scenario 6: 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');

  // Verify no horizontal scroll
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(320);

  // Upload and process
  await page.locator('input[type="file"]').setInputFiles('test-data/small-test.csv');
  await page.locator('[data-testid="encrypt-button"]').click();

  await page.waitForEvent('download');
});
```

---

## Test Data Generation

Use existing test data from 001-develop-a-web, plus new Phone column files:

```javascript
// Generate Phone column test data
function generatePhoneColumnCSV() {
  const data = [
    ['Name', 'Email', 'Phone Number', 'Department'],
    ['Alice', 'alice@test.com', '555-1234', 'Engineering'],
    ['Bob', 'bob@test.com', '555-5678', 'Sales'],
    ['Carol', 'carol@test.com', '', 'Marketing']  // Empty phone
  ];

  const csv = data.map(row => row.join(',')).join('\n');
  fs.writeFileSync('test-data/contacts-with-phone.csv', csv);
}
```

---

## Execution Summary

**Manual Testing**: Run scenarios 1-7 on real mobile devices or emulators
**Automated Testing**: Run `npm run test:e2e` with Playwright mobile emulation
**PWA Testing**: Deploy to HTTPS and test on real devices
**Acceptance Criteria**: All 7 scenarios must pass for feature to be considered complete

---

**Next**: Create tasks.md with `/tasks` command
