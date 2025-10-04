# Feature Specification: Mobile-Friendly UI & Single-File Build Option

**Feature Branch**: `002-it-has-to`
**Created**: 2025-10-04
**Status**: Ready for Planning
**Input**: User description: "it has to be mobile friendly, and add phone column to be one of the encrypted list , when build , give the option to build everyting in one html . use embeded style and script tag to contain all styles and js"

## Execution Flow (main)
```
1. Parse user description from Input
   → Extract 3 key enhancements: mobile-friendly UI, Phone column encryption, single-file build
2. Extract key concepts from description
   → Identify: responsive design, additional target column, build output format
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → Mobile usage scenario, Phone column encryption scenario, single-file deployment scenario
5. Generate Functional Requirements
   → Each requirement must be testable
6. Identify Key Entities
   → No new entities, modifications to existing column matching logic
7. Run Review Checklist
   → Verify no implementation details leaked
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-10-04
- Q: Should preprocessing (trim + lowercase) apply to only Phone columns, all target columns, email and phone only, or different approach? → A: All target columns (First Name, Last Name, Email, Mobile, Phone all get trim+lowercase before SHA-256)
- Q: How should the system handle empty or whitespace-only values in target columns? → A: Skip encryption (empty/whitespace-only cells remain empty after normalization)

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
Users need to encrypt Excel/CSV files on mobile devices (phones, tablets) just as easily as on desktop computers. Additionally, when a file contains a "Phone" column (separate from "Mobile"), it should also be encrypted. For digital marketing purposes, all encrypted values must be normalized (trimmed and converted to lowercase) before hashing to ensure consistent matching across systems. For deployment flexibility, users need the ability to generate a single HTML file that can be opened offline without any external dependencies.

### Acceptance Scenarios

**Mobile Usage:**
1. **Given** a user accesses the application on an iPhone, **When** they upload a file, **Then** the UI should adapt to the small screen size with readable text, accessible buttons, and a vertical layout
2. **Given** a user on an Android tablet rotates the device, **When** the screen orientation changes, **Then** the UI should automatically adjust without losing state or progress
3. **Given** a user on a mobile device with a 320px width screen, **When** they view the file upload area, **Then** all interactive elements should be large enough to tap (minimum 44px touch target)

**Phone Column Encryption:**
4. **Given** a CSV file with columns "Name, Email, Phone, Address", **When** the user uploads it, **Then** the system should identify "Phone" as a target column for encryption
5. **Given** an Excel file with both "Mobile" and "Phone" columns, **When** encryption is performed, **Then** both columns should be normalized (trimmed and lowercased) and encrypted with SHA-256 hashing
6. **Given** a file with "Phone Number" or "phone_number" variations, **When** the system performs column detection, **Then** it should recognize these as Phone columns using fuzzy matching
7. **Given** a file with values " John Doe " and "JOHN DOE", **When** encryption is performed, **Then** both should produce the same hash value ("john doe" after normalization)
8. **Given** a file with cells containing only whitespace "   " or empty cells, **When** encryption is performed, **Then** these cells should remain empty (no hash value generated)

**Single-File Build:**
9. **Given** the application is built for deployment, **When** the single-file build option is selected, **Then** the output should be a single HTML file containing all styles and JavaScript inline
10. **Given** a single-file HTML build, **When** opened in a browser without internet connection, **Then** the application should function fully offline
11. **Given** a single-file build, **When** inspected, **Then** all CSS should be in `<style>` tags and all JavaScript should be in `<script>` tags (no external file references)

### Edge Cases
- What happens when a mobile user uploads a 100MB file over a cellular connection?
  - Application should work but user should see clear progress indicators
- How does the system handle files with both "Mobile" and "Phone" columns containing the same data?
  - Both should be encrypted independently (duplicate hashing is acceptable)
- What happens if the single-file HTML exceeds typical size limits?
  - Single-file build should warn if bundle exceeds 10MB (reasonable limit for offline HTML files)
- How does touch scrolling work on mobile during file upload drag-and-drop?
  - On touch devices, use native file picker instead of drag-and-drop to avoid scrolling conflicts

## Requirements *(mandatory)*

### Functional Requirements

**Mobile Responsiveness:**
- **FR-001**: System MUST display a mobile-optimized layout on devices with screen widths below 768px
- **FR-002**: System MUST provide touch-friendly interactive elements with minimum 44px × 44px tap targets
- **FR-003**: System MUST adapt the layout orientation when device is rotated
- **FR-004**: System MUST display readable text without requiring horizontal scrolling on screens as small as 320px width
- **FR-005**: System MUST show the same functionality on mobile devices as on desktop (no feature degradation)
- **FR-006**: File upload component MUST work on mobile browsers using the native file picker
- **FR-007**: Progress indicators MUST be clearly visible on small screens during file processing

**Phone Column Encryption:**
- **FR-008**: System MUST recognize "Phone" as a target column for encryption (in addition to existing: First Name, Last Name, Email, Mobile)
- **FR-009**: System MUST apply fuzzy matching to Phone column variations: "Phone", "Phone Number", "phone_number", "PHONE", "phone-number", "PhoneNumber"
- **FR-010**: System MUST normalize all target column values before encryption by trimming whitespace and converting to lowercase (for digital marketing consistency)
- **FR-011**: System MUST skip encryption for empty cells or cells containing only whitespace (leave as empty after normalization)
- **FR-012**: System MUST encrypt normalized non-empty values using SHA-256 hashing algorithm
- **FR-013**: System MUST display "Phone" in the list of detected target columns when present in uploaded files
- **FR-014**: System MUST handle files containing both "Mobile" and "Phone" columns by encrypting both independently

**Single-File Build:**
- **FR-015**: Build process MUST provide an option to generate a single self-contained HTML file
- **FR-016**: Single-file HTML MUST include all CSS styles in embedded `<style>` tags
- **FR-017**: Single-file HTML MUST include all JavaScript code in embedded `<script>` tags
- **FR-018**: Single-file HTML MUST NOT reference any external resources (CSS files, JS files, fonts, icons)
- **FR-019**: Single-file HTML MUST function fully when opened from local filesystem (file:// protocol)
- **FR-020**: Single-file HTML MUST function without internet connection (fully offline capable)
- **FR-021**: Single-file build MUST maintain all application functionality (no feature reduction from regular build)
- **FR-022**: Build process MUST clearly document how to trigger single-file build vs. regular build

**Performance on Mobile:**
- **FR-023**: Application MUST remain responsive on mobile devices during file processing (no UI freezing)
- **FR-024**: Application MUST show progress updates at least every 2 seconds during encryption on mobile devices
- **FR-025**: Mobile devices MUST support the same 100MB file size limit as desktop (no reduction in capability)

### Non-Functional Requirements

**Usability:**
- **NFR-001**: Mobile UI MUST follow standard mobile design patterns (bottom navigation, larger touch targets, readable font sizes)
- **NFR-002**: Single-file HTML MUST have file size ≤10MB, with build warning if exceeded
- **NFR-003**: Mobile layout MUST be tested on iOS Safari, Chrome Android, and Samsung Internet browsers

**Compatibility:**
- **NFR-004**: Single-file build MUST work in modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **NFR-005**: Mobile layout MUST support viewport widths from 320px to 768px
- **NFR-006**: Application MUST support Progressive Web App (PWA) installation and maintain compatibility with older mobile browsers within the last 2 major versions

### Key Entities *(modifications to existing)*

**ColumnMapping** (modified):
- Existing entity that maps column headers to target types
- Now includes recognition of "Phone" as a new TargetColumnType
- Fuzzy matching logic extended to handle Phone column variations
- No structural changes to entity definition, only expansion of recognized patterns

**BuildOutput** (new concept):
- Represents the two build modes: multi-file (current) and single-file (new)
- Single-file mode bundles all assets inline
- Multi-file mode produces separate CSS/JS files (current behavior)
- Build mode selection determines bundling strategy

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (all 4 clarifications resolved)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

**Resolved Clarifications:**
1. ✅ Maximum single-file size: 10MB with build warning if exceeded
2. ✅ Mobile file size limit: Same as desktop (100MB - no reduction)
3. ✅ Touch drag-and-drop: Use native file picker on touch devices
4. ✅ PWA support: Yes, with compatibility for last 2 major browser versions

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted (mobile responsiveness, Phone column, single-file build)
- [x] Ambiguities marked (4 clarification points)
- [x] User scenarios defined (11 scenarios including normalization and whitespace handling)
- [x] Requirements generated (25 functional + 6 non-functional)
- [x] Entities identified (ColumnMapping modified, BuildOutput concept)
- [x] Review checklist passed (all clarifications resolved)

---

## Next Steps

1. ~~**Clarification Phase**: Resolve the 4 [NEEDS CLARIFICATION] items~~ ✅ **COMPLETE**
2. **Planning Phase**: Run `/plan` to generate technical design (research.md, data-model.md, plan.md)
3. **Task Breakdown**: Run `/tasks` to create detailed implementation tasks
4. **Implementation**: Execute tasks following TDD approach

## Dependencies

- **Existing Feature**: 001-develop-a-web (Excel Data Encryptor core functionality)
- **Builds Upon**: Current encryption logic, file parsing, column matching services
- **Breaking Changes**: None - all changes are additive enhancements
