# excel_data_encryptor Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-03

## Active Technologies
- TypeScript 5.3+ (001-develop-a-web)
- TypeScript 5.3+ (existing) (002-it-has-to)
- N/A (client-side only, no persistence) (002-it-has-to)

## Project Structure
```
backend/
frontend/
tests/
```

## Commands
npm test [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] npm run lint

## Code Style
TypeScript 5.3+: Follow standard conventions

## Recent Changes
- 002-it-has-to: Added mobile UI, Phone column, normalization, single-file build, PWA
- 001-develop-a-web: Added TypeScript 5.3+

## Feature 002: Mobile & Phone Column Enhancements

### Normalization for Digital Marketing
**CRITICAL**: All target column values MUST be normalized before SHA-256 hashing:
1. Trim whitespace: `value.trim()`
2. Convert to lowercase: `.toLowerCase()`
3. Skip encryption if empty after trim

**Applies to ALL target columns**: FirstName, LastName, Email, Mobile, Phone

**Implementation**: Modify `src/services/encryptionService.ts` in `hashValue()` function:
```typescript
function hashValue(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === '') return null; // Skip empty
  return sha256(normalized); // Hash normalized value
}
```

### Phone Column Support
- Add `Phone = 'PHONE'` to TargetColumnType enum
- Fuzzy matching: phone, phonenumber, phone_number, Phone Number, etc.
- Modify `src/services/columnMatcher.ts` patterns

### Mobile Responsive UI
- Breakpoints: 320px-768px (mobile), 768px+ (desktop)
- Touch targets: ≥44px minimum
- Use Ant Design Grid (Row/Col) for responsive layout
- Native file picker on touch devices (not drag-drop)

### Single-File Build
- Command: `npm run build:single`
- Plugin: vite-plugin-singlefile
- All CSS/JS inlined in single HTML
- Size limit: <10MB (warning if exceeded)

### PWA Support
- Plugin: vite-plugin-pwa
- Service worker for offline capability
- Icons: 192×192px, 512×512px
- Manifest: Excel Data Encryptor

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
