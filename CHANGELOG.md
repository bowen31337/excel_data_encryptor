# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-10-04

### Added - Mobile & Normalization Features
- **Value Normalization for Digital Marketing**: All target column values are now trimmed and converted to lowercase before SHA-256 hashing for consistent cross-platform matching
- **Phone Column Support**: Added "Phone" as a 5th target column type with fuzzy matching (phone, phonenumber, phone_number, Phone Number variations)
- **Mobile-Responsive UI**: Fully optimized for smartphones and tablets (320px-768px viewports)
  - Touch-friendly controls with ≥44px tap targets
  - Native file picker on touch devices
  - Responsive grid layout with Ant Design
  - Orientation change support
- **Single-File Build Option**: New `npm run build:single` command creates self-contained HTML file for offline deployment
  - All CSS/JS inlined in single HTML file
  - No external dependencies
  - Works from file:// protocol
  - Typical size: ~1-3MB
- **Progressive Web App (PWA) Support**: Install as native app with offline functionality
  - Service worker for offline caching
  - App manifest for installation
  - Works completely offline after first load

### Changed
- Empty/whitespace-only cells now skipped during encryption (return null instead of hash)
- Normalization ensures "JOHN DOE" and "john doe" produce identical hashes
- Updated encryption service return type to `Promise<string | null>`

### Fixed
- Case sensitivity issues in digital marketing data matching
- Whitespace handling in target column values

## [1.0.0] - 2025-10-03

### Added - Initial Release
- **Client-Side Encryption**: SHA-256 hashing using Web Crypto API, all processing in browser
- **Excel & CSV Support**: Works with .xlsx, .xls, and .csv files up to 100MB
- **Smart Column Detection**: Automatic fuzzy matching for:
  - First Name (FirstName, First_Name, first-name, fname)
  - Last Name (LastName, Last_Name, last-name, lname)
  - Email (Email, E-mail, Email Address, email_address)
  - Mobile (Mobile, Mobile Number, mobile_number)
- **Performance Optimized**: <500ms per MB encryption throughput with chunked processing
- **React 18 + TypeScript 5.3+**: Modern tech stack with strict type safety
- **Ant Design 5 UI**: Professional, accessible user interface
- **File Processing Libraries**:
  - SheetJS (xlsx) for Excel parsing
  - PapaParse for CSV parsing
- **Testing Framework**:
  - Vitest for unit tests
  - React Testing Library for component tests
  - Playwright for E2E tests
- **Code Quality**:
  - Biome for linting and formatting
  - TypeScript strict mode
  - 80%+ test coverage target

### Security
- Content Security Policy headers configured
- No external API calls or data transmission
- Input validation for file types and sizes
- SHA-256 one-way hashing (irreversible)

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- iOS Safari 14+ (mobile)
- Chrome Android 90+ (mobile)

## [Unreleased]

### Planned
- Component unit tests (Feature 001)
- Integration test suite (Feature 001)
- E2E test coverage (Features 001 & 002)
- Performance benchmarks with large files
- GitHub Pages deployment automation

---

## Version History

- **v1.1.0**: Mobile support, normalization, PWA, single-file build
- **v1.0.0**: Initial release with core encryption functionality
