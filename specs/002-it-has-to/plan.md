# Implementation Plan: Mobile-Friendly UI & Single-File Build

**Branch**: `002-it-has-to` | **Date**: 2025-10-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-it-has-to/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✅
   → Feature spec loaded successfully
2. Fill Technical Context ✅
   → Builds upon existing TypeScript/React/Vite stack
   → No NEEDS CLARIFICATION markers (all resolved)
   → **User Implementation Guidance**: Use JavaScript `string.trim()` and `string.toLowerCase()` methods for value normalization
3. Fill Constitution Check section ✅
4. Evaluate Constitution Check
   → No violations - enhancements align with existing patterns
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md ✅
6. Execute Phase 1 → data-model.md, quickstart.md, CLAUDE.md ✅
7. Re-evaluate Constitution Check ✅
8. Plan Phase 2 → Document task generation approach ✅
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 9. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

This feature enhances the existing Excel Data Encryptor (001-develop-a-web) with three key improvements:
1. **Mobile-responsive UI** - Optimize layout for smartphones and tablets (320px-768px viewports) with touch-friendly controls
2. **Phone column encryption** - Add "Phone" as a 5th target column type with fuzzy matching (Phone, Phone Number, phone_number, etc.)
3. **Single-file HTML build** - Vite plugin to bundle all CSS/JS inline for offline deployment
4. **Data normalization** - All target column values normalized (trim + lowercase) before SHA-256 hashing for digital marketing consistency

All changes are additive enhancements - no breaking changes to existing functionality.

## Technical Context

**Language/Version**: TypeScript 5.3+ (existing)
**Primary Dependencies**:
- React 18.x, Ant Design 5.x (existing)
- Vite 5.x with vite-plugin-singlefile (new)
- vite-plugin-pwa for Progressive Web App support (new)
- XLSX, PapaParse (existing)

**Storage**: N/A (client-side only, no persistence)
**Testing**: Vitest + React Testing Library + Playwright (existing)
**Target Platform**: Modern web browsers + mobile browsers (Chrome/Firefox/Safari 90+, iOS Safari 14+, Chrome Android)
**Project Type**: Single-page web application (frontend only)

**Performance Goals**:
- <500ms per MB encryption throughput (existing)
- <100ms UI response time on mobile
- Single-file bundle ≤10MB (with build warning if exceeded)
- Same 100MB file size limit on mobile devices

**Constraints**:
- Client-side only processing (no server)
- Must work offline after initial load
- Touch targets minimum 44px × 44px
- Viewport support: 320px - 768px width
- PWA-capable

**Implementation Guidance**:
- **Normalization**: Use JavaScript's `string.trim()` to remove whitespace and `string.toLowerCase()` to convert to lowercase before SHA-256 hashing
- **Empty handling**: After trim(), check if string is empty - skip encryption if empty

**Scale/Scope**:
- 3 enhancement areas (mobile UI, Phone column, build option)
- ~10-15 new tests (mobile responsiveness, Phone column matching, build validation)
- 1 new Vite plugin configuration
- CSS media queries for responsive breakpoints

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality Standards
**Status**: ✅ PASS
- TypeScript strict mode enforced (existing)
- Biome linting configuration (existing)
- Single responsibility maintained (separate concerns: UI, column matching, build)
- DRY principles: Extend existing columnMatcher service, add responsive styles via Ant Design Grid
- **NEW**: Normalization logic using native JavaScript methods (`.trim()`, `.toLowerCase()`) - simple, readable, maintainable

### II. Testing Discipline (Non-Negotiable)
**Status**: ✅ PASS
- TDD approach: Write tests for Phone column matching before implementation
- Unit tests for updated columnMatcher service
- Test normalization edge cases (whitespace-only, mixed case)
- Responsive UI tests using React Testing Library + viewport simulation
- E2E tests for mobile scenarios using Playwright with mobile emulation
- Build validation tests for single-file output
- Target: ≥80% coverage maintained

### III. User Experience Consistency
**Status**: ✅ PASS
- Mobile UI follows Ant Design responsive patterns
- Same functionality on mobile as desktop (FR-005)
- Clear progress indicators on small screens (FR-007)
- Consistent error messaging (existing patterns)
- Native file picker on touch devices (better UX than drag-drop)

### IV. Performance Requirements
**Status**: ✅ PASS
- Maintains <500ms per MB throughput on mobile (FR-023)
- UI remains responsive during processing (FR-021, FR-022)
- Single-file bundle optimized (code splitting, tree shaking)
- No performance degradation from responsive CSS
- Normalization adds negligible overhead (native string operations)

### V. Security & Data Protection
**Status**: ✅ PASS
- No security changes (client-side only, same SHA-256 hashing)
- Content Security Policy maintained (existing)
- No new external dependencies for core functionality
- Single-file build includes same security features
- Normalization prevents case-sensitivity issues in marketing data matching

**Initial Gate**: ✅ **PASS** - All constitutional principles satisfied

## Project Structure

### Documentation (this feature)
```
specs/002-it-has-to/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command) - minimal changes
├── quickstart.md        # Phase 1 output (/plan command) - mobile scenarios
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── components/
│   └── (no new components, App.tsx contains all UI)
├── services/
│   ├── columnMatcher.ts       # MODIFIED: Add Phone column variations
│   ├── encryptionService.ts   # MODIFIED: Add normalization (trim + lowercase) before hashing
│   ├── fileParser.ts          # UNCHANGED
│   ├── fileGenerator.ts       # UNCHANGED
│   └── (existing services)
├── types/
│   └── encryption.types.ts    # MODIFIED: Add Phone to TargetColumnType enum
├── utils/
│   └── (existing utils)
├── App.tsx                    # MODIFIED: Add responsive CSS, mobile-optimized layout
└── main.tsx                   # UNCHANGED

tests/
├── unit/
│   ├── columnMatcher.test.ts  # MODIFIED: Add Phone column test cases
│   ├── encryptionService.test.ts  # MODIFIED: Add normalization test cases
│   └── (existing tests)
├── integration/
│   └── mobile.test.tsx        # NEW: Mobile responsive tests
└── e2e/
    └── mobile.spec.ts         # NEW: Playwright mobile scenarios

vite.config.ts                 # MODIFIED: Add vite-plugin-singlefile
package.json                   # MODIFIED: Add vite-plugin-singlefile dependency
```

**Structure Decision**: Single-page web application. All changes extend existing structure from 001-develop-a-web. No new directories needed - enhancements are modifications to existing files plus responsive CSS.

## Phase 0: Outline & Research

**Purpose**: Research technical approaches for mobile responsiveness, build bundling, and PWA capabilities.

### Research Topics

1. **Vite Single-File Build Plugin**
   - Plugin: vite-plugin-singlefile vs vite-plugin-html-inline
   - Decision criteria: Bundle size, inline strategy, CSP compatibility
   - Configuration for inline CSS/JS while preserving functionality
   - Build size warnings and optimization strategies

2. **Responsive Design Approach**
   - Ant Design Grid system (Row/Col) vs CSS Grid/Flexbox
   - Breakpoint strategy: mobile (<768px), tablet (768-991px), desktop (≥992px)
   - Touch target sizing (44px minimum per Apple/Google guidelines)
   - Viewport meta tag configuration

3. **Mobile Browser Compatibility**
   - iOS Safari quirks (viewport units, touch events)
   - Chrome Android behavior (file upload, progress indicators)
   - Samsung Internet specific considerations
   - Feature detection vs browser detection

4. **Progressive Web App (PWA) Setup**
   - Service worker for offline capability
   - Web app manifest configuration
   - Install prompt handling
   - vite-plugin-pwa integration

5. **Touch Input Handling**
   - Native file picker vs drag-and-drop on touch devices
   - Touch event handling vs mouse events
   - Preventing scroll conflicts during file upload
   - Mobile-specific accessibility considerations

6. **Build Optimization for Single-File Output**
   - Code splitting vs inline bundling tradeoffs
   - Tree shaking effectiveness
   - Ant Design CSS optimization (only used components)
   - Compression strategies (gzip, brotli)

**Output**: `research.md` documenting all technology decisions with rationale

## Phase 1: Design & Contracts

*Prerequisites: research.md complete*

### 1. Data Model (`data-model.md`)

**Minimal Changes Required**:
- `TargetColumnType` enum: Add `Phone = 'PHONE'`
- `ColumnMapping`: No structural changes, just expanded pattern matching
- No new entities needed
- Document responsive state handling (orientation changes, viewport size)
- Document normalization transformation (trim + lowercase applied before hashing)

### 2. Service Contracts

**No new contracts needed**. Existing contracts from 001-develop-a-web already support:
- `IColumnMatcher.findTargetColumns()` - extend with Phone patterns
- `IEncryptionService.hashValue()` - **MODIFIED**: add normalization step (value.trim().toLowerCase()) before SHA-256
- `IFileParser` - no changes
- `IFileGenerator` - no changes

**Build Contract** (new concept, not a service):
```typescript
// vite.config.ts configuration shape
interface SingleFileBuildConfig {
  plugins: [
    viteSingleFile({
      removeViteModuleLoader: true,
      useRecommendedBuildConfig: true,
    })
  ],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000, // Inline all assets
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      }
    }
  }
}
```

### 3. Contract Tests

**Extend existing tests**:
- `tests/unit/columnMatcher.test.ts`: Add Phone column variations test cases
- `tests/unit/encryptionService.test.ts`: Add normalization test cases
  - Test: `"  JOHN DOE  ".trim().toLowerCase()` → `"john doe"` → SHA-256 hash
  - Test: `"   "` (whitespace only) → skip encryption (empty after trim)
- `tests/integration/mobile.test.tsx`: Responsive layout, touch targets, viewport handling
- `tests/e2e/mobile.spec.ts`: Playwright mobile device emulation

**New test scenarios**:
- Phone column detection (fuzzy matching)
- Value normalization (trim + lowercase)
- Whitespace-only cell handling
- Mobile viewport rendering (320px, 375px, 768px)
- Touch interaction (file upload via native picker)
- Single-file build validation (no external references)
- PWA manifest and service worker registration

### 4. Integration Test Scenarios (`quickstart.md`)

**New mobile-specific scenarios**:
- **Scenario 1**: Upload on iPhone (viewport 375px), encrypt file, verify UI responsiveness
- **Scenario 2**: Tablet rotation test (portrait → landscape), verify state persistence
- **Scenario 3**: Upload CSV with Phone column variations, verify encryption
- **Scenario 4**: Test normalization: " John Doe " and "JOHN DOE" produce same hash
- **Scenario 5**: Single-file HTML deployment, test offline functionality
- **Scenario 6**: PWA installation, verify app works when installed

### 5. Update Agent Context

Run: `.specify/scripts/bash/update-agent-context.sh claude`

**Output**: data-model.md, quickstart.md, CLAUDE.md (updated with mobile and Phone column guidance)

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:

1. **Setup Tasks** (T001-T003):
   - Install vite-plugin-singlefile dependency
   - Update TypeScript types (add Phone to TargetColumnType enum)
   - Configure vite.config.ts for single-file build option

2. **Phone Column Enhancement** (T004-T007):
   - Update columnMatcher.ts with Phone patterns
   - Add Phone column test cases to columnMatcher.test.ts
   - Update App.tsx to display Phone in detected columns list
   - Verify existing encryption logic handles Phone column

3. **Normalization Implementation** (T008-T011):
   - Update encryptionService.ts: add `.trim().toLowerCase()` before hashing
   - Add normalization test cases (whitespace, case variations)
   - Test empty/whitespace-only handling (skip encryption)
   - Update success message to reflect normalized cell count

4. **Mobile Responsive UI** (T012-T019):
   - Add viewport meta tag to index.html
   - Update App.tsx with Ant Design Grid (Row/Col) for responsive layout
   - Implement media queries for breakpoints (320px, 768px, 992px)
   - Update touch targets to 44px minimum
   - Replace drag-drop with native file picker on touch devices
   - Test responsive rendering (unit tests with viewport simulation)
   - Write Playwright mobile E2E tests

5. **Single-File Build** (T020-T024):
   - Configure vite-plugin-singlefile in vite.config.ts
   - Add npm script: `build:single` for single-file output
   - Test build output (verify no external references)
   - Add build size warning (if bundle >10MB)
   - Update README with build instructions

6. **PWA Setup** (T025-T029) [OPTIONAL - If time permits]:
   - Install vite-plugin-pwa
   - Create web app manifest
   - Configure service worker for offline caching
   - Add install prompt UI
   - Test PWA installation flow

7. **Testing & Validation** (T030-T034):
   - Run all existing tests to ensure no regressions
   - Execute mobile E2E scenarios on real devices or emulators
   - Validate single-file build works offline
   - Performance testing on mobile (ensure <500ms/MB maintained)
   - Update documentation (README, quickstart.md)

**Ordering Strategy**:
- Setup → Phone Column → Normalization → Mobile UI → Single-File Build → PWA → Validation
- TDD enforced: Tests before implementation for Phone column and normalization
- Mobile UI can be developed incrementally (breakpoint by breakpoint)
- Mark [P] for parallel execution where components are independent

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md scenarios)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No violations detected. All enhancements align with existing architecture and constitutional principles.

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md created
- [x] Phase 1: Design complete (/plan command) - data-model.md, quickstart.md, CLAUDE.md created
- [x] Phase 2: Task planning approach documented
- [x] Phase 3: Tasks generated (/tasks command) - tasks.md created with 50 tasks
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS (no new violations)
- [x] All NEEDS CLARIFICATION resolved (spec has 2 resolved clarifications)
- [x] Complexity deviations documented (none)

**Artifacts Created**:
- [x] plan.md (this file)
- [x] research.md (technology decisions for mobile, PWA, single-file build)
- [x] data-model.md (TargetColumnType enum extension)
- [x] quickstart.md (mobile scenarios, Phone column scenarios)
- [x] CLAUDE.md (agent context file updated with feature 002 guidance)
- [x] tasks.md (50 tasks organized in 12 phases)

---
*Based on Constitution v1.0.0 - See `/.specify/memory/constitution.md`*
