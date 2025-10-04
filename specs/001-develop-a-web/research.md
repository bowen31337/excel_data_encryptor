# Technical Research: Excel Data Encryptor Web UI

**Date**: 2025-10-02
**Feature**: 001-develop-a-web
**Purpose**: Document technology decisions and resolve remaining unknowns

## 1. Excel File Processing in Browser

### Decision: SheetJS (xlsx library)

**Rationale**:
- Most mature and widely adopted Excel library for JavaScript (50k+ GitHub stars)
- Supports .xlsx, .xls, and other Excel formats
- Works entirely client-side (no server required)
- Good performance for files up to 100MB
- Active maintenance and security updates
- API: `XLSX.read()` for parsing, `XLSX.write()` for generation

**Alternatives Considered**:
- **ExcelJS**: Better for creating complex Excel features (charts, images), but heavier bundle size (~350KB vs ~600KB minified). We don't need advanced features.
- **xlsx-populate**: Smaller bundle but less format support. Doesn't support .xls files.

**Multi-Sheet Handling**:
- SheetJS provides `workbook.SheetNames` array
- Access first sheet: `workbook.Sheets[workbook.SheetNames[0]]`
- Ignore remaining sheets (as per clarification)

**Bundle Impact**: ~350KB min+gzip (~1.2MB uncompressed)

## 2. CSV Parsing

### Decision: PapaParse

**Rationale**:
- De facto standard for CSV parsing in browsers (11k+ GitHub stars)
- Handles edge cases: quoted fields, embedded newlines, various encodings
- Streaming support for large files
- Auto-detection of delimiters
- Both parsing and unparsing (generation) support
- API: `Papa.parse()` for CSV → JSON, `Papa.unparse()` for JSON → CSV

**Alternatives Considered**:
- **csv-parse**: Node.js focused, requires browserify/webpack config. Less browser-optimized.
- **Native string.split()**: Fails on quoted fields, embedded commas, not robust.

**Bundle Impact**: ~45KB min+gzip

## 3. SHA-256 Hashing

### Decision: Web Crypto API (native browser API)

**Rationale**:
- Native browser implementation (no bundle impact)
- Better performance than JavaScript implementations
- Supported in all modern browsers (Chrome 37+, Firefox 34+, Safari 11+, Edge 79+)
- Cryptographically secure (maintained by browser vendors)
- Async API fits well with React patterns

**Implementation**:
```typescript
async function hashSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Alternatives Considered**:
- **crypto-js**: Popular library (14k+ GitHub stars) but adds ~30KB bundle size. Web Crypto API is faster and native.
- **js-sha256**: Smaller (~5KB) but still slower than native implementation.

**Bundle Impact**: 0KB (native browser API)

## 4. File Download Mechanism

### Decision: Blob + URL.createObjectURL (native)

**Rationale**:
- Native browser API (no dependencies)
- Works for large files (100MB+)
- Simple implementation
- Memory efficient with proper cleanup

**Implementation**:
```typescript
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url); // Clean up memory
}
```

**Alternatives Considered**:
- **FileSaver.js**: Adds 5KB for minimal benefit. Native solution sufficient for modern browsers.
- **Data URLs**: Limited to ~2MB in some browsers, not suitable for 100MB files.

**Bundle Impact**: 0KB (native browser API)

## 5. Large File Processing

### Decision: Chunked Processing + React State Updates (no Web Workers initially)

**Rationale**:
- Process files in chunks (e.g., 1000 rows at a time) with `setTimeout` to yield control
- Update progress state after each chunk for UI feedback
- Simpler than Web Workers for MVP
- Can add Web Workers later if performance issues arise

**Implementation Strategy**:
```typescript
async function processFileInChunks(data: any[][], chunkSize = 1000) {
  const results = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const processed = await processChunk(chunk);
    results.push(...processed);

    // Yield control to browser for UI updates
    await new Promise(resolve => setTimeout(resolve, 0));

    // Update progress: (i + chunkSize) / data.length
  }
  return results;
}
```

**Alternatives Considered**:
- **Web Workers**: Better performance but adds complexity (serialization overhead, debugging difficulty). Defer unless needed.
- **Synchronous processing**: Freezes UI for large files. Not acceptable per NFR-003 (100ms feedback requirement).

**Progress Tracking**: Ant Design Progress component with percentage calculation

## 6. GitHub Pages Deployment

### Decision: Vite + GitHub Actions

**Vite Configuration**:
```typescript
// vite.config.ts
export default defineConfig({
  base: '/excel_data_encryptor/', // GitHub Pages subdirectory
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
```

**GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
- Trigger on push to `main` branch
- Install dependencies (`npm ci`)
- Run tests (`npm test`)
- Build (`npm run build`)
- Deploy to `gh-pages` branch using `peaceiris/actions-gh-pages`

**Routing**: Use hash routing (`#/`) since GitHub Pages doesn't support SPA history routing without server config

**Alternatives Considered**:
- **Vercel/Netlify**: Better SPA support but requires external service. GitHub Pages keeps everything in GitHub ecosystem.
- **History routing**: Requires server-side rewrite rules. Not available on GitHub Pages without workarounds.

## 7. Remaining Specification Clarifications

### FR-010: File Preview Details

**Decision**: Show file name, size, and estimated row count

**Implementation**:
- File name: `file.name`
- File size: Format bytes (e.g., "5.2 MB")
- Row count: Parse file to get row count, display "~1,234 rows" (async)

**UI Component**: `FileInfo.tsx` with Ant Design Descriptions or Card

### FR-014: Error Messages for Unsupported Formats

**Decision**: Clear, actionable error messages

**Messages**:
- Unsupported format: "Please upload a valid Excel (.xlsx, .xls) or CSV file. File type '.docx' is not supported."
- File too large: "File size exceeds 100MB limit. Please upload a smaller file."
- Missing target columns: "File must contain at least one of these columns: First Name, Last Name, Mobile, Email."
- Parse error: "Unable to read file. The file may be corrupted or password-protected."

**UI**: Ant Design notification.error() with 6-second duration

### FR-017: Visual Feedback During Processing

**Decision**: Use Ant Design Spin + Progress components

**Implementation**:
- Initial upload: Spin with "Uploading file..."
- Processing: Progress bar with percentage and estimated time remaining
- Completion: notification.success() with download link

**States**:
1. Idle: Show upload area
2. Uploading: Spin overlay
3. Processing: Progress bar (0-100%)
4. Complete: Success notification + auto-download
5. Error: Error notification with retry option

### NFR-004: Browser Version Support

**Decision**: Modern evergreen browsers (last 2 years)

**Supported**:
- Chrome 90+ (April 2021+)
- Firefox 88+ (April 2021+)
- Safari 14+ (September 2020+)
- Edge 90+ (April 2021+)

**Rationale**: Web Crypto API, ES2020 features, modern React compatibility

**Detection**: Display warning for unsupported browsers (can use `browserslist` in package.json)

### NFR-005: Responsive Design Requirements

**Decision**: Desktop-first, tablet/mobile secondary

**Breakpoints** (Ant Design defaults):
- Desktop: ≥992px (primary target)
- Tablet: 768-991px (functional but less polished)
- Mobile: <768px (basic functionality, vertical layout)

**Implementation**:
- Use Ant Design Grid system (Row/Col)
- Upload area scales down on mobile
- Button remains full-width on mobile

**Testing**: Manually test on common viewports, E2E tests focus on desktop

## Technology Stack Summary

| Component | Technology | Bundle Size | Rationale |
|-----------|-----------|-------------|-----------|
| Build Tool | Vite 5.x | N/A | Fast dev server, optimized builds, TypeScript support |
| UI Framework | React 18.x | ~45KB | Industry standard, great TypeScript support, hooks |
| Component Library | Ant Design 5.x | ~300KB | Comprehensive components, consistent design, well-documented |
| Linting/Formatting | Biome | N/A (dev only) | All-in-one tool, faster than ESLint+Prettier |
| Testing | Vitest + RTL | N/A (dev only) | Fast, Vite-native, React Testing Library for components |
| E2E Testing | Playwright | N/A (dev only) | Cross-browser, reliable, good TypeScript support |
| Excel Parsing | SheetJS (xlsx) | ~350KB | Mature, reliable, full format support |
| CSV Parsing | PapaParse | ~45KB | Robust, handles edge cases, streaming support |
| Hashing | Web Crypto API | 0KB | Native, fast, secure |
| File Download | Blob + URL API | 0KB | Native, simple, efficient |
| Deployment | GitHub Pages | N/A | Free, integrated with repo, CI/CD via Actions |

**Total Added Bundle Size**: ~740KB (minified + gzipped estimated ~200KB)

## Performance Targets

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| File encryption throughput | <500ms per MB | Vitest benchmark test with 10MB sample |
| UI feedback latency | <100ms | Manual testing + React DevTools Profiler |
| Maximum file size | 100MB | Integration test with 100MB CSV |
| Test coverage | ≥80% overall, 100% encryption | Vitest coverage report |
| Build time | <30 seconds | GitHub Actions CI time |
| Bundle size | <500KB gzipped | `npm run build` size analysis |

## Security Considerations

1. **Content Security Policy**: Configure via meta tag to restrict script sources
2. **Input Validation**: Validate file types, sizes before processing
3. **Memory Management**: Clear file data from memory after processing (`file = null`)
4. **Dependency Auditing**: Run `npm audit` in CI pipeline
5. **HTTPS Only**: GitHub Pages enforces HTTPS
6. **No Data Transmission**: All processing client-side, log disclaimer in UI

## Next Steps

✅ All technical unknowns resolved
✅ All [NEEDS CLARIFICATION] items addressed
✅ Technology stack finalized
→ **Ready for Phase 1: Design & Contracts**
