# Technical Research: Mobile-Friendly UI & Single-File Build

**Date**: 2025-10-04
**Feature**: 002-it-has-to
**Purpose**: Document technology decisions for mobile responsiveness, PWA, and single-file build

## 1. Vite Single-File Build Plugin

### Decision: vite-plugin-singlefile

**Rationale**:
- Specifically designed for inlining all assets into a single HTML file
- Active maintenance and Vite 5.x compatibility
- Simple configuration with good defaults
- Handles CSS, JS, and images inline
- Preserves React functionality and Web Crypto API

**Alternatives Considered**:
- **vite-plugin-html-inline**: Less mature, limited documentation
- **Manual bundling**: Too complex, error-prone for React apps

**Configuration**:
```typescript
// vite.config.ts
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile({
      removeViteModuleLoader: true,
      useRecommendedBuildConfig: true,
    })
  ],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000, // 100MB - inline everything
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      }
    }
  }
})
```

**Build Size Strategy**:
- Use Rollup's `manualChunks` to optimize bundle size
- Tree-shake Ant Design (only import used components)
- Post-build size check script warns if >10MB
- Ant Design CSS reset adds ~50KB, can be optimized with CSS modules

**Bundle Size Estimate**:
- React + React-DOM: ~140KB (gzipped)
- Ant Design (tree-shaken): ~250KB (gzipped)
- XLSX library: ~150KB (gzipped)
- PapaParse: ~45KB (gzipped)
- App code: ~20KB (gzipped)
- **Total**: ~605KB gzipped, ~2.5MB uncompressed
- Well under 10MB limit ✅

## 2. Responsive Design Approach

### Decision: Ant Design Grid System + Custom Media Queries

**Rationale**:
- Ant Design Grid (`<Row>`, `<Col>`) integrates seamlessly with existing UI
- Built-in responsive props (xs, sm, md, lg, xl, xxl)
- Consistent with Ant Design philosophy already in use
- Custom media queries supplement where needed (touch targets, font sizes)

**Breakpoint Strategy**:
```typescript
// Ant Design default breakpoints
xs: < 576px   // Mobile portrait
sm: ≥ 576px   // Mobile landscape
md: ≥ 768px   // Tablet portrait
lg: ≥ 992px   // Tablet landscape / small desktop
xl: ≥ 1200px  // Desktop
xxl: ≥ 1600px // Large desktop
```

**Our Usage**:
- **Mobile** (xs, sm): < 768px - Vertical stacking, full-width elements, 48px touch targets
- **Tablet** (md): 768px - 991px - Mixed layout, 44px touch targets
- **Desktop** (lg+): ≥ 992px - Current horizontal layout (unchanged)

**Implementation**:
```typescript
// App.tsx example
<Row gutter={[16, 16]}>
  <Col xs={24} md={12} lg={8}>
    {/* Full width on mobile, half on tablet, 1/3 on desktop */}
  </Col>
</Row>
```

**Touch Target Sizing**:
- Apple: 44px × 44px minimum (iOS Human Interface Guidelines)
- Google: 48dp × 48dp minimum (Material Design)
- **Our standard**: 44px minimum, 48px preferred
- Ant Design buttons default to 32px height → override to 48px on mobile

**Viewport Meta Tag**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
```
- `initial-scale=1.0`: No zooming by default
- `maximum-scale=5.0`: Allow zoom up to 5x (accessibility)
- `user-scalable=yes`: Enable pinch-zoom (accessibility requirement)

**Alternatives Considered**:
- **CSS Grid/Flexbox only**: More manual, less integration with Ant Design
- **Tailwind CSS**: Requires complete UI rewrite, overkill for this enhancement

## 3. Mobile Browser Compatibility

### iOS Safari Quirks

**Viewport Units (vh, vw)**:
- iOS Safari's address bar affects vh calculations
- **Solution**: Use `dvh` (dynamic viewport height) where supported, fallback to `vh`
- Avoid `100vh` for full-screen layouts - use `min-height: 100dvh; min-height: 100vh;`

**Touch Event Handling**:
- iOS Safari has `-webkit-overflow-scrolling: touch` for momentum scrolling
- File input requires `accept` attribute to trigger camera on iOS
- **Solution**: `<input type="file" accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv">`

**Web Crypto API**:
- Fully supported in iOS Safari 14+ (our minimum)
- Requires HTTPS (or localhost for development)
- **No changes needed** - existing implementation compatible

### Chrome Android Behavior

**File Upload**:
- Chrome Android supports drag-and-drop via file picker
- Better UX: Use `<input type="file">` instead of drag-drop on mobile
- **Decision**: Detect touch capability, show file picker button instead of drag-drop zone

**Progress Indicators**:
- Chrome Android may throttle JS in background tabs
- **Solution**: Use `Page Visibility API` to pause processing if tab hidden
- Show persistent notification for long operations

### Samsung Internet

**Compatibility**:
- Based on Chromium, generally compatible with Chrome
- Supports Web Crypto API, modern ES6+
- **Testing**: Include in Playwright E2E tests

**Feature Detection vs Browser Detection**:
```typescript
// Prefer feature detection
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const supportsFileAPI = 'File' in window;
const supportsWebCrypto = 'crypto' in window && 'subtle' in crypto;
```

## 4. Progressive Web App (PWA) Setup

### Decision: vite-plugin-pwa (Workbox-based)

**Rationale**:
- Official Vite PWA plugin, well-maintained
- Uses Google Workbox for service worker generation
- Automatic manifest generation
- Supports offline caching strategies
- Simple configuration for basic offline support

**Installation**:
```bash
npm install -D vite-plugin-pwa
```

**Configuration**:
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

plugins: [
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'assets/**/*'],
    manifest: {
      name: 'Excel Data Encryptor',
      short_name: 'Excel Encrypt',
      description: 'Encrypt sensitive Excel/CSV data with SHA-256 hashing',
      theme_color: '#1890ff',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait-primary',
      icons: [
        {
          src: '/assets/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/assets/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      runtimeCaching: []
    }
  })
]
```

**Manifest Requirements**:
- **Name**: "Excel Data Encryptor"
- **Icons**: 192×192 and 512×512 PNG (maskable icons preferred)
- **Display**: "standalone" (app-like experience)
- **Orientation**: "any" (allow rotation)
- **Theme color**: #1890ff (matching existing blue)

**Service Worker Strategy**:
- **Precache**: All app assets (HTML, CSS, JS)
- **Runtime cache**: None (fully client-side, no API calls)
- **Update strategy**: Auto-update on new version

**Install Prompt**:
```typescript
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show custom install button
});

// User clicks install button
deferredPrompt.prompt();
const { outcome } = await deferredPrompt.userChoice;
// outcome: 'accepted' or 'dismissed'
```

**Alternatives Considered**:
- **Manual service worker**: Too complex, error-prone
- **next-pwa**: Next.js specific, not compatible with Vite

## 5. Touch Input Handling

### Decision: Conditional UI Based on Touch Capability

**Touch Detection**:
```typescript
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// In App.tsx
{isTouchDevice ? (
  <input type="file" accept=".xlsx,.xls,.csv" />
) : (
  <Upload.Dragger>...</Upload.Dragger>
)}
```

**Rationale**:
- Drag-and-drop on touch devices conflicts with scrolling
- Native file picker provides better UX on mobile
- Automatically opens camera/gallery options on mobile

**Touch Event vs Mouse Event**:
- Ant Design components handle both automatically
- For custom components, use `onPointerDown/Up/Move` (unified events)
- Avoid `onClick` delays on mobile (use `onTouchStart` for instant feedback)

**Preventing Scroll Conflicts**:
```css
/* Only if implementing custom drag-drop */
.upload-area {
  touch-action: none; /* Disable browser touch handling */
}
```

**Mobile-Specific Accessibility**:
- Ensure focus outlines are visible for keyboard navigation
- ARIA labels for screen readers
- Minimum contrast ratio 4.5:1 (WCAG AA)

**Button Sizing**:
```css
@media (max-width: 768px) {
  .ant-btn {
    min-height: 48px; /* Override Ant Design's 32px default */
    font-size: 16px;   /* Prevent iOS zoom on focus */
    padding: 0 24px;   /* Wider touch target */
  }
}
```

## 6. Build Optimization for Single-File Output

### Tree Shaking Ant Design

**Import Strategy**:
```typescript
// ❌ Bad: Imports entire library
import { Button } from 'antd';

// ✅ Good: Already optimized with Vite
import { Button } from 'antd'; // Vite handles tree-shaking automatically
```

Vite + Ant Design 5.x automatically tree-shakes unused components. No manual optimization needed.

### Code Splitting vs Inline Bundling

**Tradeoff**:
- **Code splitting**: Better for multi-page apps, allows lazy loading
- **Inline bundling**: Better for single HTML file, simpler deployment

**Decision**: Use inline bundling for `build:single` command, keep code splitting for regular build

**Dual Build Strategy**:
```json
// package.json
{
  "scripts": {
    "build": "vite build",  // Regular build with code splitting
    "build:single": "vite build --mode single"  // Single-file build
  }
}
```

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'single' ? [viteSingleFile()] : [])
  ],
  build: mode === 'single' ? {
    // Single-file config
  } : {
    // Regular config with code splitting
  }
}))
```

### Compression Strategies

**Gzip Compression**:
- Most web servers support gzip automatically
- Vite doesn't gzip by default (server responsibility)
- For single-file HTML: User downloads as-is (no server compression)

**Brotli Compression**:
- Better compression than gzip (~20% smaller)
- Not relevant for single-file HTML (no server)

**Asset Optimization**:
- Use SVG for icons (scalable, small size)
- Inline small images as base64 (< 10KB)
- XLSX/PapaParse are already minified

**Bundle Size Validation**:
```typescript
// post-build script
import fs from 'fs';

const singleHTML = fs.readFileSync('dist/index.html', 'utf-8');
const sizeBytes = Buffer.byteLength(singleHTML, 'utf-8');
const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);

if (sizeBytes > 10 * 1024 * 1024) {
  console.warn(`⚠️  Single-file build is ${sizeMB}MB (exceeds 10MB recommended limit)`);
} else {
  console.log(`✅ Single-file build: ${sizeMB}MB`);
}
```

## Technology Stack Summary

| Component | Technology | Bundle Impact | Rationale |
|-----------|-----------|---------------|-----------|
| Responsive UI | Ant Design Grid + Media Queries | +0KB | Uses existing Ant Design |
| Touch Detection | Feature detection APIs | +0KB | Native browser APIs |
| Single-File Build | vite-plugin-singlefile | +5KB (dev only) | Best Vite plugin for inline bundling |
| PWA Support | vite-plugin-pwa | +30KB (service worker) | Industry standard, auto-generates manifest |
| Mobile Testing | Playwright Device Emulation | +0KB (dev only) | Existing Playwright setup |

**Total Added Bundle Size**: ~30KB (service worker only), main bundle remains ~605KB gzipped

## Performance Targets

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| Mobile encryption throughput | <500ms per MB | Vitest benchmark on mobile emulator |
| UI feedback latency | <100ms | Manual testing with Chrome DevTools throttling |
| Bundle size (single-file) | ≤10MB uncompressed | Post-build validation script |
| PWA install time | <5 seconds | Lighthouse PWA audit |
| Touch responsiveness | <16ms (60fps) | React DevTools Profiler |

## Browser Support Matrix

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome (Desktop) | 90+ | Full support (existing) |
| Firefox (Desktop) | 88+ | Full support (existing) |
| Safari (Desktop) | 14+ | Full support (existing) |
| Edge (Desktop) | 90+ | Full support (existing) |
| iOS Safari | 14+ | Mobile primary target, PWA support |
| Chrome Android | 90+ | Mobile primary target, PWA support |
| Samsung Internet | 14+ | Chromium-based, good compatibility |
| Firefox Android | 88+ | Secondary mobile target |

## Next Steps

✅ All technical unknowns resolved
✅ No remaining [NEEDS CLARIFICATION] items
✅ Technology stack finalized
✅ Performance targets defined
→ **Ready for Phase 1: Design & Contracts**
