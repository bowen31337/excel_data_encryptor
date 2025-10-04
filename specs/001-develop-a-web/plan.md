# Implementation Plan: Excel Data Encryptor Web UI

**Branch**: `001-develop-a-web` | **Date**: 2025-10-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-develop-a-web/spec.md`

## Summary

Build a client-side web application that allows users to upload Excel (.xlsx, .xls) and CSV files, encrypt specific columns (First Name, Last Name, Mobile, Email) using SHA-256 hashing, and download the processed files. All processing happens in the browser with no server-side code. The application uses Vite for build tooling, TypeScript for type safety, Ant Design for UI components, Biome for linting, Vitest for testing, and deploys to GitHub Pages via GitHub Actions.

## Technical Context

**Language/Version**: TypeScript 5.3+
**Primary Dependencies**:
- Vite 5.x (build tool and dev server)
- React 18.x (UI framework)
- Ant Design 5.x (UI component library)
- xlsx (SheetJS) for Excel file processing
- PapaParse for CSV parsing
- crypto-js for SHA-256 hashing

**Storage**: N/A (client-side only, no persistence)
**Testing**: Vitest + React Testing Library + Playwright (E2E)
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single-page web application (pure frontend, no backend)
**Performance Goals**:
- <500ms per MB file encryption throughput
- <100ms UI response time
- Handle files up to 100MB without browser freeze

**Constraints**:
- Client-side only processing (no server communication)
- Must work offline after initial load
- Browser memory limit (~500MB for large file operations)
- TypeScript strict mode required

**Scale/Scope**:
- Single-page application
- ~10-15 React components
- Support files up to 100MB (~1M rows)
- No user authentication or backend infrastructure

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality Standards
**Status**: ✅ PASS
- TypeScript strict mode enforces type safety
- Biome configured for linting and formatting (replaces ESLint/Prettier)
- Single responsibility enforced through React component architecture
- Error boundaries for React error handling

### II. Testing Discipline (Non-Negotiable)
**Status**: ✅ PASS
- Vitest for unit tests (≥80% coverage target)
- React Testing Library for component tests
- Playwright for E2E integration tests
- TDD approach: write tests before implementation
- Performance tests for encryption throughput (500ms/MB threshold)
- 100% coverage required for encryption/hashing logic

### III. User Experience Consistency
**Status**: ✅ PASS
- Ant Design provides consistent UI components
- Clear error messages for all failure scenarios
- Progress indicators for file processing (Ant Design Spin/Progress)
- Matches provided design mockup (blue theme, lock icon branding)
- Informational notes displayed per design

### IV. Performance Requirements
**Status**: ✅ PASS
- Streaming approach for large files (Web Workers for async processing)
- Performance target: <500ms per MB (constitution compliant)
- <100ms UI feedback requirement met through React state updates
- Chunked processing to avoid browser freeze
- Performance benchmarks in test suite

### V. Security & Data Protection
**Status**: ✅ PASS
- Client-side only (no data transmission to servers)
- Industry-standard crypto-js library for SHA-256 (no custom crypto)
- Input validation for file types and sizes
- Secure memory handling (clear file data after processing)
- Content Security Policy headers via GitHub Pages config

**Initial Gate**: ✅ **PASS** - All constitutional principles satisfied

## Project Structure

### Documentation (this feature)
```
specs/001-develop-a-web/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   └── encryption-service.contract.ts
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
/
├── src/
│   ├── components/
│   │   ├── FileUploader.tsx        # Drag-and-drop upload component
│   │   ├── EncryptButton.tsx       # Encrypt & Download button
│   │   ├── FileInfo.tsx            # Display uploaded file details
│   │   ├── InfoNotes.tsx           # Important notes section
│   │   └── Layout.tsx              # Page layout with header
│   ├── services/
│   │   ├── fileParser.ts           # Excel/CSV parsing logic
│   │   ├── encryptionService.ts    # SHA-256 hashing logic
│   │   ├── columnMatcher.ts        # Fuzzy column name matching
│   │   └── fileGenerator.ts        # Generate encrypted files
│   ├── types/
│   │   ├── file.types.ts           # File-related type definitions
│   │   └── encryption.types.ts     # Encryption-related types
│   ├── utils/
│   │   ├── validation.ts           # File validation utilities
│   │   └── dateFormatter.ts        # Date formatting for filenames
│   ├── hooks/
│   │   └── useFileProcessor.ts     # Custom hook for file processing
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # Entry point
│   └── vite-env.d.ts               # Vite type definitions
├── tests/
│   ├── unit/
│   │   ├── columnMatcher.test.ts
│   │   ├── encryptionService.test.ts
│   │   ├── fileParser.test.ts
│   │   └── fileGenerator.test.ts
│   ├── integration/
│   │   ├── fileProcessing.test.tsx
│   │   └── userFlow.test.tsx
│   └── e2e/
│       └── encryption-workflow.spec.ts
├── public/
│   └── assets/
│       └── lock-icon.svg           # Lock icon for branding
├── .github/
│   └── workflows/
│       ├── ci.yml                  # CI pipeline (tests, lint, build)
│       └── deploy.yml              # GitHub Pages deployment
├── biome.json                      # Biome configuration
├── vite.config.ts                  # Vite configuration
├── vitest.config.ts                # Vitest configuration
├── playwright.config.ts            # Playwright E2E configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies and scripts
├── index.html                      # HTML entry point
└── README.md                       # User documentation
```

**Structure Decision**: Single-page web application structure. Pure frontend with no backend directory needed. All code in `src/` following React best practices. Testing follows TDD with unit, integration, and E2E tests separated.

## Phase 0: Outline & Research

**Purpose**: Resolve remaining technical unknowns and document technology choices.

### Research Topics

1. **Excel File Processing in Browser**
   - Library: SheetJS (xlsx) vs ExcelJS
   - Decision criteria: Bundle size, browser compatibility, streaming support
   - Multi-sheet handling approach

2. **CSV Parsing**
   - Library: PapaParse vs csv-parse
   - Decision criteria: Performance, encoding support, API simplicity

3. **SHA-256 Hashing**
   - Library: crypto-js vs Web Crypto API
   - Decision criteria: Browser support, performance, API simplicity

4. **File Download Mechanism**
   - Approach: Blob + URL.createObjectURL vs FileSaver.js
   - Memory management for large files

5. **Large File Processing**
   - Web Workers for background processing
   - Chunking strategies to avoid UI freeze
   - Progress tracking implementation

6. **GitHub Pages Deployment**
   - Vite base path configuration
   - GitHub Actions workflow setup
   - SPA routing considerations (hash routing vs history)

7. **Remaining NEEDS CLARIFICATION from spec**
   - FR-010: File preview (show file name, size, row count)
   - FR-014: Error messages for unsupported formats
   - FR-017: Visual feedback (use Ant Design Spin + Progress)
   - NFR-004: Browser versions (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
   - NFR-005: Responsive design (desktop primary, tablet/mobile secondary)

**Output**: `research.md` documenting all technology decisions with rationale

## Phase 1: Design & Contracts

*Prerequisites: research.md complete*

### 1. Data Model (`data-model.md`)

**Entities**:
- `UploadedFile`: { name, size, type, content }
- `ProcessedFile`: { originalName, encryptedContent, processedDate }
- `ColumnMapping`: { originalName, normalizedName, isTarget }
- `EncryptionResult`: { success, message, processedRows, encryptedColumns }

**State Management**: React useState + useReducer for file processing state machine

### 2. Service Contracts (`contracts/`)

No REST APIs (client-side only), but define service interfaces:

**`contracts/encryption-service.contract.ts`**:
```typescript
interface IEncryptionService {
  hashValue(value: string): string;
  processFile(file: File, targetColumns: string[]): Promise<ProcessedFile>;
  validateFileType(file: File): ValidationResult;
  generateDownloadFilename(originalName: string): string;
}

interface IColumnMatcher {
  findTargetColumns(headers: string[]): ColumnMapping[];
  normalizeColumnName(name: string): string;
}

interface IFileParser {
  parseExcel(file: File): Promise<ParsedData>;
  parseCSV(file: File): Promise<ParsedData>;
  generateExcel(data: ParsedData): Blob;
  generateCSV(data: ParsedData): Blob;
}
```

### 3. Contract Tests

Write failing tests for each service interface in `tests/unit/`:
- `encryptionService.test.ts`: SHA-256 hashing, empty cell handling
- `columnMatcher.test.ts`: Fuzzy matching cases
- `fileParser.test.ts`: Excel/CSV parsing, first sheet only
- `fileGenerator.test.ts`: File generation with correct naming

### 4. Integration Test Scenarios (`quickstart.md`)

**Scenario 1**: Upload Excel with exact column names → encrypt → download
**Scenario 2**: Upload CSV with fuzzy column names → encrypt → download
**Scenario 3**: Upload file with empty cells → verify empty cells remain empty
**Scenario 4**: Upload file without target columns → show error
**Scenario 5**: Upload 50MB file → verify performance <25s (500ms/MB × 50)

### 5. Update Agent Context

Run: `.specify/scripts/bash/update-agent-context.sh claude`

**Output**: data-model.md, contracts/encryption-service.contract.ts, failing contract tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. **Setup Tasks** (T001-T005):
   - Initialize Vite + React + TypeScript project
   - Configure Biome for linting
   - Set up Vitest + React Testing Library
   - Configure Playwright for E2E tests
   - Set up GitHub Actions workflows

2. **Contract Test Tasks** (T006-T010) [P]:
   - One test file per service contract
   - Tests MUST fail initially (TDD)
   - Each test file can be written in parallel

3. **Core Service Implementation** (T011-T020):
   - columnMatcher.ts + tests passing
   - encryptionService.ts + tests passing
   - fileParser.ts + tests passing
   - fileGenerator.ts + tests passing
   - Validation utilities + tests passing

4. **UI Component Tasks** (T021-T030) [P]:
   - FileUploader component + tests
   - EncryptButton component + tests
   - FileInfo component + tests
   - InfoNotes component + tests
   - Layout component + tests
   - App.tsx integration

5. **Integration Test Tasks** (T031-T035):
   - User flow integration tests
   - Performance benchmark tests
   - E2E Playwright tests for quickstart scenarios

6. **Deployment Tasks** (T036-T040):
   - Configure Vite for GitHub Pages
   - Set up GitHub Actions CI/CD
   - Add README with usage instructions
   - Performance validation (verify <500ms/MB)

**Ordering Strategy**:
- Setup → Contract Tests → Services → UI → Integration → Deployment
- TDD enforced: Tests before implementation at each layer
- Mark [P] for parallel execution where components are independent

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No violations detected. All constitutional principles are satisfied by the chosen architecture.

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md created
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md, CLAUDE.md created
- [x] Phase 2: Task planning complete (/plan command - approach documented above)
- [x] Phase 3: Tasks generated (/tasks command) - tasks.md created with 71 tasks
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS (no new violations)
- [x] All NEEDS CLARIFICATION resolved (all addressed in research.md)
- [x] Complexity deviations documented (none)

**Artifacts Created**:
- [x] plan.md (this file)
- [x] research.md (technology decisions)
- [x] data-model.md (entities and state machine)
- [x] contracts/encryption-service.contract.ts (service interfaces)
- [x] quickstart.md (8 integration test scenarios)
- [x] tasks.md (71 tasks organized in 12 phases)
- [x] CLAUDE.md (agent context file updated)

---
*Based on Constitution v1.0.0 - See `/.specify/memory/constitution.md`*
