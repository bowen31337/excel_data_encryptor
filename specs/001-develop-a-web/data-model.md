# Data Model: Excel Data Encryptor Web UI

**Date**: 2025-10-02
**Feature**: 001-develop-a-web

## Overview

This document defines the data structures, state management, and domain entities for the Excel Data Encryptor web application. Since this is a client-side-only application with no persistence, the data model focuses on runtime state and in-memory data structures.

## Core Entities

### 1. UploadedFile

Represents a file uploaded by the user before processing.

```typescript
interface UploadedFile {
  file: File;                    // Native browser File object
  name: string;                  // Original filename
  size: number;                  // File size in bytes
  type: string;                  // MIME type (e.g., 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  lastModified: number;          // Timestamp of last modification
}
```

**Validation Rules**:
- `size` MUST be ≤ 100MB (104,857,600 bytes)
- `type` MUST be one of: 'text/csv', 'application/vnd.ms-excel' (.xls), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' (.xlsx)
- `file` MUST not be null or undefined

**Lifecycle**: Created on file upload → Exists until processing completes → Cleared from memory

### 2. ParsedData

Represents the structured data extracted from an Excel or CSV file.

```typescript
interface ParsedData {
  headers: string[];             // Column headers (first row)
  rows: CellValue[][];           // Data rows (2D array)
  sheetName?: string;            // Sheet name (Excel only, undefined for CSV)
  rowCount: number;              // Number of data rows (excluding header)
  columnCount: number;           // Number of columns
}

type CellValue = string | number | boolean | null | undefined;
```

**Validation Rules**:
- `headers` MUST contain at least 1 element
- `headers` MUST NOT contain duplicate values (case-insensitive check)
- `rows.length` MUST equal `rowCount`
- Each row in `rows` MUST have `columnCount` elements

**Relationships**:
- Derived from `UploadedFile` via parsing
- Input to `ColumnMapping` identification

### 3. ColumnMapping

Maps original column names to normalized names and identifies target columns.

```typescript
interface ColumnMapping {
  originalName: string;          // Original header from file (e.g., "First_Name")
  normalizedName: string;        // Normalized version (e.g., "firstname")
  isTarget: boolean;             // True if this column should be encrypted
  targetType?: TargetColumnType; // Type of target column if isTarget=true
  columnIndex: number;           // Zero-based index in headers array
}

enum TargetColumnType {
  FirstName = 'FIRST_NAME',
  LastName = 'LAST_NAME',
  Mobile = 'MOBILE',
  Email = 'EMAIL',
}
```

**Validation Rules**:
- `originalName` MUST match a header in `ParsedData.headers`
- `normalizedName` MUST be lowercase with spaces/underscores/dashes removed
- `isTarget` is true only if `normalizedName` matches one of: 'firstname', 'lastname', 'mobile', 'email' (or variations like 'emailaddress')
- `columnIndex` MUST be ≥0 and < `ParsedData.columnCount`

**Normalization Algorithm**:
```typescript
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s_-]+/g, '')     // Remove spaces, underscores, dashes
    .trim();
}
```

**Fuzzy Matching Rules**:
- "email address", "e-mail", "emailaddress" → "email"
- "first name", "firstname", "fname" → "firstname"
- "last name", "lastname", "lname" → "lastname"
- "mobile", "mobile number", "phone", "mobilenumber" → "mobile"

### 4. EncryptionResult

Represents the outcome of the encryption process.

```typescript
interface EncryptionResult {
  success: boolean;               // True if encryption completed without errors
  message: string;                // Success or error message for UI display
  processedData?: ParsedData;     // Encrypted data (only if success=true)
  stats: EncryptionStats;         // Processing statistics
  errors?: string[];              // Array of error messages (if success=false)
}

interface EncryptionStats {
  totalRows: number;              // Total rows processed
  encryptedCells: number;         // Number of cells encrypted
  emptyCellsSkipped: number;      // Number of empty cells skipped
  targetColumnsFound: string[];   // Names of target columns found
  processingTimeMs: number;       // Total processing time in milliseconds
}
```

**Validation Rules**:
- If `success=true`, `processedData` MUST be defined and `errors` MUST be undefined
- If `success=false`, `errors` MUST contain at least 1 error message
- `stats.totalRows` MUST equal `ParsedData.rowCount`
- `stats.processingTimeMs` MUST be >0

### 5. ProcessedFile

Represents the final encrypted file ready for download.

```typescript
interface ProcessedFile {
  blob: Blob;                     // File data as Blob
  filename: string;               // Generated filename with timestamp
  mimeType: string;               // MIME type matching original file
  size: number;                   // File size in bytes
  generatedAt: Date;              // Timestamp when file was generated
}
```

**Filename Pattern**: `[originalname]_[YYYY-MM-DD]_encrypted.[extension]`
- Example: `employees_2025-10-02_encrypted.xlsx`

**Validation Rules**:
- `blob.size` MUST be >0
- `filename` MUST match pattern (regex: `.+_\d{4}-\d{2}-\d{2}_encrypted\.(xlsx|xls|csv)$`)
- `mimeType` MUST match original file type

## State Management

### Application State Machine

The application follows a linear state flow:

```
IDLE → UPLOADING → PARSING → READY → ENCRYPTING → COMPLETE → IDLE
                      ↓         ↓         ↓
                    ERROR    ERROR     ERROR
```

**State Definitions**:

```typescript
enum AppState {
  IDLE = 'IDLE',                 // No file uploaded
  UPLOADING = 'UPLOADING',       // File being read
  PARSING = 'PARSING',           // File being parsed
  READY = 'READY',               // File parsed, ready to encrypt
  ENCRYPTING = 'ENCRYPTING',     // Encryption in progress
  COMPLETE = 'COMPLETE',         // Encryption done, file downloadable
  ERROR = 'ERROR',               // Error occurred
}

interface AppStateData {
  currentState: AppState;
  uploadedFile?: UploadedFile;
  parsedData?: ParsedData;
  columnMappings?: ColumnMapping[];
  encryptionResult?: EncryptionResult;
  processedFile?: ProcessedFile;
  progress?: number;              // 0-100 for ENCRYPTING state
  errorMessage?: string;          // Error details for ERROR state
}
```

**State Transitions**:
- `IDLE → UPLOADING`: User selects file
- `UPLOADING → PARSING`: File read complete
- `PARSING → READY`: Parsing successful, target columns found
- `PARSING → ERROR`: Parsing failed or no target columns found
- `READY → ENCRYPTING`: User clicks "Encrypt & Download"
- `ENCRYPTING → COMPLETE`: Encryption successful
- `ENCRYPTING → ERROR`: Encryption failed
- `COMPLETE → IDLE`: User starts over or uploads new file
- `ERROR → IDLE`: User dismisses error and starts over

**React Implementation**: Use `useReducer` hook for state machine

```typescript
type StateAction =
  | { type: 'FILE_SELECTED'; payload: File }
  | { type: 'FILE_PARSED'; payload: ParsedData }
  | { type: 'COLUMNS_MAPPED'; payload: ColumnMapping[] }
  | { type: 'ENCRYPTION_STARTED' }
  | { type: 'ENCRYPTION_PROGRESS'; payload: number }
  | { type: 'ENCRYPTION_COMPLETE'; payload: ProcessedFile }
  | { type: 'ERROR_OCCURRED'; payload: string }
  | { type: 'RESET' };
```

## Data Flow Diagram

```
User Action: Upload File
    ↓
[FileUploader Component]
    ↓
UploadedFile created
    ↓
[fileParser.parseFile()]
    ↓
ParsedData created
    ↓
[columnMatcher.findTargetColumns()]
    ↓
ColumnMapping[] created
    ↓
State → READY (display file info + encrypt button)
    ↓
User Action: Click "Encrypt & Download"
    ↓
[encryptionService.processFile()]
    ↓
EncryptionResult created
    ↓
[fileGenerator.generate()]
    ↓
ProcessedFile created
    ↓
State → COMPLETE (auto-download + success message)
```

## Validation Rules Summary

| Entity | Field | Rule |
|--------|-------|------|
| UploadedFile | size | ≤100MB |
| UploadedFile | type | Must be CSV or Excel MIME type |
| ParsedData | headers | No duplicates (case-insensitive) |
| ParsedData | rows | Each row has same column count |
| ColumnMapping | isTarget | True only for normalized target names |
| EncryptionResult | success | If true, processedData must exist |
| ProcessedFile | filename | Must match timestamp pattern |

## Error Scenarios

| Scenario | State | Error Message |
|----------|-------|---------------|
| File >100MB | ERROR | "File size exceeds 100MB limit." |
| Unsupported format | ERROR | "Unsupported file format. Please upload .xlsx, .xls, or .csv." |
| No target columns found | ERROR | "No target columns found. File must contain First Name, Last Name, Mobile, or Email." |
| Parse failure | ERROR | "Unable to read file. It may be corrupted or password-protected." |
| Empty file | ERROR | "File is empty or contains no data rows." |
| Encryption failure | ERROR | "Encryption failed. Please try again." |

## Performance Considerations

1. **Memory Management**:
   - Clear `uploadedFile.file` after parsing to free memory
   - Clear `parsedData` after encryption to free memory
   - Use `URL.revokeObjectURL()` immediately after download

2. **Large Files**:
   - Process rows in chunks (1000 rows per chunk)
   - Update `progress` state after each chunk
   - Use `setTimeout(0)` to yield control to browser between chunks

3. **Immutability**:
   - All state updates create new objects (React best practice)
   - Use `structuredClone()` or spread operators for deep copies

## Type Safety

All entities defined as TypeScript interfaces/types with strict mode enabled:
- No `any` types allowed
- Explicit null/undefined handling
- Discriminated unions for state machine
- Zod or similar for runtime validation (optional, recommended)

---

**Next**: Define service contracts in `contracts/` directory
