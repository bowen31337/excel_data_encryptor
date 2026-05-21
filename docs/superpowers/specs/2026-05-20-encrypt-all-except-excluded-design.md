# Encrypt-All-Except-Excluded Mode

**Status:** Design approved 2026-05-20
**Author:** Bowen Li (with Claude)
**Feature area:** `src/services/columnMatcher.ts`, `src/App.tsx`, `index.html`

## Problem

The encryptor today hashes a hard-coded whitelist of five columns: FirstName, LastName, Email, Mobile, Phone (`src/services/columnMatcher.ts`). Anything else passes through in plaintext. To use this tool for any other dataset (addresses, DOBs, postcodes, IDs, custom fields), a developer has to edit TypeScript and rebuild.

We want the opposite default: **encrypt every column, except a small predefined list**. The list must be editable directly in the single-file HTML output (`npm run build:single`), so a non-developer can reconfigure exclusions in a text editor without a toolchain.

## Goals

1. Replace the whitelist with an exclusion list driven by `window.excludingColumn` in `index.html`.
2. Make the list survive `npm run build:single` so it sits near the top of the built HTML, editable in any text editor.
3. Show a persistent UI warning that communicates which columns will and will not be encrypted.
4. Keep the existing SHA-256 hashing, normalization, file parsing, and download flow untouched.

## Non-goals (YAGNI)

- Runtime UI toggle to switch back to whitelist mode.
- Per-column checkboxes to override the exclusion list at runtime.
- Persisting the exclusion list to `localStorage` or remote config.
- Regex or substring matching of column names.
- A separate "encrypt these specific columns" inverse mode.

## Configuration source

A single `<script>` block in `index.html`, placed in `<head>` before the Vite/React entry script:

```html
<head>
  <script>
    /* Edit this list to control which columns are NOT encrypted.
       Matching is case-insensitive and trims outer whitespace, but is
       otherwise EXACT — e.g. "name" matches "Name", "NAME", " name "
       but NOT "first_name", "name_", or "username".
       Leave empty (`[]`) or remove this script to encrypt EVERY column. */
    window.excludingColumn = ['name', 'address'];
  </script>
  ...
</head>
```

**Corrected 2026-05-21:** matching was initially specified as fuzzy (strip spaces / underscores / dashes); revised to case-insensitive *exact* match to avoid surprising users with broad matches like `"name"` excluding `"first_name"`.

`vite-plugin-singlefile` inlines bundled assets but preserves the `index.html` shell, so this script appears verbatim near the top of the build output. To reconfigure, the user opens the built HTML in a text editor, edits the array literal, saves. No rebuild.

## Matching rules

`normalizeColumnName()` in `src/services/columnMatcher.ts`:

- Lowercase the string.
- Trim outer whitespace.
- Preserve internal characters (spaces, underscores, dashes, etc.) verbatim.

A header is excluded from encryption if its normalized form is byte-for-byte equal to the normalized form of any entry in `window.excludingColumn`.

| `excludingColumn` entry | Header in file | Excluded? |
|---|---|---|
| `name` | `Name` | yes |
| `name` | `NAME ` | yes (outer whitespace trimmed) |
| `name` | `first_name` | **no** (different string after lowercasing) |
| `name` | `name_` | **no** (internal underscore preserved) |
| `name` | `first name` | **no** (internal space preserved) |
| `first name` | `First Name` | yes |
| `email` | `E-Mail` | **no** (dash preserved → `e-mail` ≠ `email`) |
| `e-mail` | `E-Mail` | yes |

## Architecture changes

### `src/services/columnMatcher.ts`

- Keep `normalizeColumnName()` as-is — it's the matching primitive.
- Replace `findTargetColumns(headers)` with `findColumnsToEncrypt(headers, excludingColumn?)`:
  - If `excludingColumn` is omitted, read `window.excludingColumn`.
  - Guard with `Array.isArray(...)`; otherwise default to `[]` and emit `console.warn` once.
  - Build a `Set<string>` of normalized excluded names.
  - Return a `ColumnMapping[]` where `isTarget = true` iff the header's normalized form is NOT in the excluded set.
- Replace `hasTargetColumns(headers)` with `hasColumnsToEncrypt(headers, excludingColumn?)` — returns true when at least one mapping has `isTarget = true`.
- Add a new helper `getExcludedHeaders(headers, excludingColumn?)`: returns the original-cased headers that matched the exclusion list. Used by the UI to render "Excluded from encryption: …".

### `src/types/encryption.types.ts`

- Delete `TargetColumnType` enum (dead code after the flip).
- Remove the optional `targetType?: TargetColumnType` field from `ColumnMapping`. The encryption loop only reads `isTarget` and `columnIndex`, so this is safe.

### `src/App.tsx`

Four surgical edits:

1. Memoize the global once at the top of `App()`:
   ```ts
   const excludingColumn = useMemo(() => {
     const raw = (window as unknown as { excludingColumn?: unknown }).excludingColumn;
     return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
   }, []);
   ```
2. Replace both call sites of `findTargetColumns(parsed.headers)` (in `handleFileUpload` and `handleFileInputChange`) with `findColumnsToEncrypt(parsed.headers, excludingColumn)`.
3. Replace the existing "No target columns found" error branch with a check on `hasColumnsToEncrypt(...)`:
   - If `false` (every header is excluded): set ERROR with message *"All columns are excluded — nothing to encrypt."*
4. Update the File Information card (App.tsx:366–385) to show two `Descriptions.Item`s:
   - **Excluded from encryption** — original-cased excluded headers, or "None".
   - **Columns to encrypt** — original-cased non-excluded headers, with count.

### `index.html`

Add the configuration `<script>` described in [Configuration source](#configuration-source).

## UI: warning copy

A persistent `Alert` (Ant Design, `type="warning"`) placed in `App.tsx` directly above the existing blue "Important Notes" alert. Always visible in every state.

**When `excludingColumn.length > 0`:**

> ⚠️ **All columns will be encrypted with SHA-256, except: name, address.**
> Make sure your file's headers match this exclusion list before uploading. Any column not in this list — including sensitive data you may not have intended to hash — will be irreversibly hashed.

**When `excludingColumn.length === 0`:**

> ⚠️ **Every column in your file will be encrypted with SHA-256.**
> No columns are excluded. Edit `window.excludingColumn` in this file to exclude specific columns.

The excluded names are rendered from the raw `window.excludingColumn` values (lowercase as authored), comma-joined.

## Data flow

```
index.html
  └─ <script>window.excludingColumn = ['name', 'address']</script>
       │
       ▼
App.tsx mounts
  └─ useMemo reads window.excludingColumn, guards with Array.isArray
       │
       ▼
User uploads file
  └─ parser produces ParsedData { headers, rows }
       │
       ▼
findColumnsToEncrypt(headers, excludingColumn)
  └─ returns ColumnMapping[] (isTarget = NOT excluded)
       │
       ▼
Existing encryption loop (App.tsx:122-151, unchanged)
  └─ for each mapping where isTarget, hashValue(cell)
       │
       ▼
Existing file generator + download (unchanged)
```

## Edge cases

| Case | Behavior |
|---|---|
| `window.excludingColumn` undefined | Treat as `[]`; warning copy switches to "every column will be encrypted" |
| `window.excludingColumn` not an array (e.g. string, object) | Treat as `[]`; `console.warn` once on mount |
| Empty array `[]` | Encrypt all columns; warning copy switches accordingly |
| Array contains non-strings | Non-strings filtered out silently by the memo |
| Excluded entry matches no header | Silent — nothing to exclude, all headers get hashed |
| Every header matches an excluded entry | Block with ERROR state: "All columns are excluded — nothing to encrypt." |
| Duplicate entries in the array (e.g. `['name', 'NAME']`) | Deduplicate via normalization (`Set<string>`) — harmless |
| File has zero data rows but valid headers | Existing behavior preserved; runs through the loop with no rows |

## Testing

### Unit tests — `tests/unit/columnMatcher.test.ts`

Replace whitelist test cases with:

- Empty excluding list → every header has `isTarget = true`.
- Single excluding entry, exact match (`'name'` vs header `Name`) → that header has `isTarget = false`, others `true`.
- Single excluding entry, fuzzy match (`'address'` vs header `ADDRESS `) → excluded.
- Excluding entry that matches no header → all headers encrypted.
- Every header excluded → `hasColumnsToEncrypt` returns `false`.
- Duplicate entries in excluding list → no double-counting.
- `getExcludedHeaders` returns original casing, not normalized.

### Integration / contract tests

- Update tests that previously asserted "only 5 target columns are hashed" — now they should assert "all minus excluded are hashed".

### New test — global read path

- Mock `window.excludingColumn` and verify `findColumnsToEncrypt()` picks it up when called without the second argument.
- Test fallback: `window.excludingColumn` undefined → behaves as `[]`.
- Test fallback: `window.excludingColumn = "not an array"` → behaves as `[]` and warns.

### Build verification

- Run `npm run build:single` and grep the output HTML for `window.excludingColumn` to confirm it survives bundling.

## Migration / rollout

- `TargetColumnType` enum and the old `findTargetColumns` / `hasTargetColumns` names are removed in the same change. No downstream consumers outside `App.tsx` and the tests.
- Existing users who relied on the implicit FirstName/LastName/Email/Mobile/Phone behavior will need to:
  - Either accept the new default (all columns encrypted) by leaving `excludingColumn = []`.
  - Or list the columns they want to keep plaintext (e.g. `['id', 'orderdate']`).
- The CLAUDE.md "Active Technologies" section will be updated to note the behavior change. The "Feature 002: Mobile & Phone Column Enhancements" section is preserved (normalization rules still apply to whatever columns get hashed).

## Files touched

- `index.html` — new `<script>` block defining `window.excludingColumn`.
- `src/services/columnMatcher.ts` — rewrite from whitelist to exclusion list.
- `src/types/encryption.types.ts` — delete `TargetColumnType`, drop `targetType?` from `ColumnMapping`.
- `src/App.tsx` — memoize global, swap function calls, replace error branch, update File Information card, add persistent warning Alert.
- `tests/unit/columnMatcher.test.ts` — rewrite test suite.
- Any contract/integration test that hard-codes the five target column names.
- `CLAUDE.md` — short note on the new behavior under "Recent Changes".
