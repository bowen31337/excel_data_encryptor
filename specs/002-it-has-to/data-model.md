# Data Model: Mobile-Friendly UI & Single-File Build

**Date**: 2025-10-04
**Feature**: 002-it-has-to

## Overview

This feature extends the existing Excel Data Encryptor data model (from 001-develop-a-web) with minimal changes:
1. Add "Phone" as a new `TargetColumnType`
2. Add normalization transformation (trim + lowercase) before SHA-256 hashing for digital marketing consistency
3. Document responsive state handling (viewport changes, orientation)

All other entities remain unchanged. See `specs/001-develop-a-web/data-model.md` for complete data model.

## Modified Entities

### TargetColumnType (Enum Extension)

**Existing** (from 001-develop-a-web):
```typescript
enum TargetColumnType {
  FirstName = 'FIRST_NAME',
  LastName = 'LAST_NAME',
  Mobile = 'MOBILE',
  Email = 'EMAIL',
}
```

**Modified** (002-it-has-to):
```typescript
enum TargetColumnType {
  FirstName = 'FIRST_NAME',
  LastName = 'LAST_NAME',
  Mobile = 'MOBILE',
  Email = 'EMAIL',
  Phone = 'PHONE',          // ← NEW: Added for FR-008
}
```

**Fuzzy Matching Rules** (extends existing patterns):

| Target Type | Variations Recognized |
|------------|----------------------|
| Phone | `phone`, `phonenumber`, `phone_number`, `phone-number`, `phoneno`, `Phone Number` |

**Implementation Location**: `src/types/encryption.types.ts`

**Impact**:
- `ColumnMapping` entity automatically supports Phone via existing structure
- `findTargetColumns()` service needs pattern update
- No breaking changes - all existing patterns still work

### Value Normalization Transformation (NEW)

**Purpose**: Ensure consistent SHA-256 hashes for digital marketing data matching across systems.

**Transformation Rules**:
```typescript
// Apply to ALL target column values before SHA-256 hashing
function normalizeValue(value: string): string | null {
  // Step 1: Trim whitespace
  const trimmed = value.trim();

  // Step 2: Check if empty after trim
  if (trimmed === '') {
    return null; // Skip encryption for empty/whitespace-only cells
  }

  // Step 3: Convert to lowercase
  return trimmed.toLowerCase();
}
```

**Examples**:
| Input | After trim() | After toLowerCase() | Hash? |
|-------|-------------|---------------------|-------|
| "  JOHN DOE  " | "JOHN DOE" | "john doe" | ✅ Yes |
| "JOHN DOE" | "JOHN DOE" | "john doe" | ✅ Yes (same hash as above) |
| "john doe" | "john doe" | "john doe" | ✅ Yes (same hash as above) |
| "   " | "" | "" | ❌ No (returns empty) |
| "" | "" | "" | ❌ No (returns empty) |
| "  John@Example.COM  " | "John@Example.COM" | "john@example.com" | ✅ Yes |

**Applies To**: ALL target column types
- FirstName
- LastName
- Email
- Mobile
- Phone

**Implementation Location**: `src/services/encryptionService.ts` in `hashValue()` function

**Business Rationale**: Digital marketing platforms require consistent lowercased, trimmed values for accurate cross-platform matching and deduplication.

### ColumnMapping (No Structural Changes)

Existing entity from 001-develop-a-web handles Phone column without modification:

```typescript
interface ColumnMapping {
  originalName: string;          // e.g., "Phone Number"
  normalizedName: string;        // e.g., "phonenumber"
  isTarget: boolean;             // true if Phone pattern matched
  targetType?: TargetColumnType; // TargetColumnType.Phone
  columnIndex: number;           // column position
}
```

**Usage Example**:
```typescript
// File with "Phone Number" column
const headers = ['Name', 'Phone Number', 'Address'];
const mappings = findTargetColumns(headers);

// Result:
[
  { originalName: 'Name', normalizedName: 'name', isTarget: false, columnIndex: 0 },
  { originalName: 'Phone Number', normalizedName: 'phonenumber', isTarget: true, targetType: TargetColumnType.Phone, columnIndex: 1 },
  { originalName: 'Address', normalizedName: 'address', isTarget: false, columnIndex: 2 }
]
```

## Responsive State Handling

### Viewport State (New Concept)

While not a data entity, the application must track viewport state for mobile responsiveness:

```typescript
interface ViewportState {
  width: number;           // Current viewport width (px)
  height: number;          // Current viewport height (px)
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';  // Ant Design breakpoint
  orientation: 'portrait' | 'landscape';  // Device orientation
  isTouchDevice: boolean;  // Touch capability detection
}
```

**Tracking Method**:
```typescript
// React hook
const [viewport, setViewport] = useState<ViewportState>({
  width: window.innerWidth,
  height: window.innerHeight,
  breakpoint: getBreakpoint(window.innerWidth),
  orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
  isTouchDevice: 'ontouchstart' in window
});

// Update on window resize
useEffect(() => {
  const handleResize = () => setViewport({
    width: window.innerWidth,
    height: window.innerHeight,
    breakpoint: getBreakpoint(window.innerWidth),
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    isTouchDevice: 'ontouchstart' in window
  });

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

**Breakpoint Calculation**:
```typescript
function getBreakpoint(width: number): Breakpoint {
  if (width < 576) return 'xs';
  if (width < 768) return 'sm';
  if (width < 992) return 'md';
  if (width < 1200) return 'lg';
  if (width < 1600) return 'xl';
  return 'xxl';
}
```

**State Persistence During Orientation Change**:
- File upload state (`uploadedFile`, `parsedData`) persists during orientation change
- Progress indicators continue during device rotation
- No data loss on viewport resize

## Unchanged Entities

The following entities from 001-develop-a-web remain unchanged:

- `UploadedFile` - File metadata (name, size, type)
- `ParsedData` - Parsed Excel/CSV data structure
- `CellValue` - Cell value types (string, number, boolean, null, undefined)
- `EncryptionResult` - Encryption operation results
- `EncryptionStats` - Processing statistics
- `ProcessedFile` - Generated encrypted file
- `ValidationResult` - Validation outcomes
- `AppState` - Application state machine (IDLE, PARSING, READY, ENCRYPTING, COMPLETE, ERROR)

All encryption, parsing, and generation logic works identically on mobile and desktop.

## Data Flow (Mobile-Specific Considerations)

```
User Action: Upload File (Touch Device)
    ↓
[File Input Picker] ← (Instead of drag-drop on touch devices)
    ↓
UploadedFile created
    ↓
[fileParser.parseFile()]
    ↓
ParsedData created
    ↓
[columnMatcher.findTargetColumns()]
    ↓
ColumnMapping[] created (includes Phone if present)
    ↓
State → READY (display file info + encrypt button)
    ↓
User Action: Click "Encrypt & Download" (48px touch target on mobile)
    ↓
[encryptionService.processFile()]
    ↓
For each target cell:
  1. Apply normalization: value.trim().toLowerCase()
  2. If empty after trim → skip encryption (leave cell empty)
  3. If non-empty → SHA-256 hash normalized value
    ↓
EncryptionResult created
    ↓
[fileGenerator.generate()]
    ↓
ProcessedFile created
    ↓
State → COMPLETE (auto-download + success message)
```

**Mobile Differences**:
1. File picker instead of drag-drop (UX optimization)
2. Larger touch targets for buttons (44-48px minimum)
3. Progress indicators optimized for small screens
4. Responsive layout adjustments (vertical stacking on mobile)

## Validation Rules Summary

| Entity | Field | Rule | Change |
|--------|-------|------|--------|
| TargetColumnType | Phone | Recognized as valid target | **NEW** |
| ColumnMapping | targetType | Can be Phone | **EXTENDED** |
| ColumnMapping | normalizedName | Matches "phonenumber" variations | **EXTENDED** |

All other validation rules from 001-develop-a-web remain unchanged.

## Error Scenarios

No new error scenarios. Existing error handling covers:
- File >100MB → Error (same on mobile)
- Unsupported format → Error (same on mobile)
- No target columns found → Error (but now checks for Phone too)
- Parse failure → Error (same on mobile)

## Performance Considerations

1. **Mobile Memory**:
   - Same 100MB file limit (FR-023)
   - Chunked processing (100 rows/chunk) prevents memory spikes
   - Clear file data after processing (same as desktop)

2. **Responsive State Updates**:
   - Viewport changes debounced (300ms) to avoid excessive re-renders
   - Orientation change does not re-parse file
   - CSS media queries handle layout (no JS re-renders)

3. **Touch Events**:
   - Passive event listeners for better scroll performance
   - No custom touch handling (use native file picker)

## Type Safety

All type extensions maintain strict TypeScript compatibility:
```typescript
// src/types/encryption.types.ts
export enum TargetColumnType {
  FirstName = 'FIRST_NAME',
  LastName = 'LAST_NAME',
  Mobile = 'MOBILE',
  Email = 'EMAIL',
  Phone = 'PHONE',  // Added
}

// Type guard for Phone column
function isPhoneColumn(mapping: ColumnMapping): boolean {
  return mapping.targetType === TargetColumnType.Phone;
}
```

---

**Summary of Changes**:
- ✅ Added `Phone` to `TargetColumnType` enum
- ✅ Extended fuzzy matching patterns for Phone variations
- ✅ Added normalization transformation (trim + lowercase) for digital marketing
- ✅ Documented responsive state handling
- ✅ No breaking changes to existing entities
- ✅ Maintains full backward compatibility

**Next**: Define integration test scenarios in `quickstart.md`
