#!/bin/bash
# Build validation script for single-file HTML build
# Checks that the build size is under 10MB (recommended limit)

set -e

echo "🔍 Checking single-file build..."

# Check if dist/index.html exists
if [ ! -f "dist/index.html" ]; then
  echo "❌ Error: dist/index.html not found. Run 'npm run build:single' first."
  exit 1
fi

# Get file size (cross-platform: macOS and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  SIZE=$(stat -f%z dist/index.html 2>/dev/null)
else
  # Linux
  SIZE=$(stat --format=%s dist/index.html 2>/dev/null)
fi

# Convert to MB
SIZE_MB=$(echo "scale=2; $SIZE / 1024 / 1024" | bc)

echo "📦 Single-file build size: ${SIZE_MB}MB"

# Check if size exceeds 10MB
if (( $(echo "$SIZE_MB > 10" | bc -l) )); then
  echo "⚠️  WARNING: Build size ${SIZE_MB}MB exceeds recommended 10MB limit!"
  echo "   Consider:"
  echo "   - Tree shaking unused code"
  echo "   - Optimizing images (use SVG where possible)"
  echo "   - Reviewing dependencies"
  exit 1
else
  echo "✅ Build size OK (under 10MB limit)"
fi

# Check that no separate JS/CSS files exist (should be all inline, except PWA files)
# PWA service worker files (registerSW.js, sw.js, workbox-*.js) must remain separate
JS_COUNT=$(find dist -name "*.js" ! -name "registerSW.js" ! -name "sw.js" ! -name "workbox-*.js" 2>/dev/null | wc -l | tr -d ' ')
CSS_COUNT=$(find dist -name "*.css" 2>/dev/null | wc -l | tr -d ' ')

if [ "$JS_COUNT" -gt 0 ] || [ "$CSS_COUNT" -gt 0 ]; then
  echo "⚠️  WARNING: Found $JS_COUNT JS files and $CSS_COUNT CSS files"
  echo "   Single-file build should inline all assets (excluding PWA service worker)!"
  exit 1
else
  echo "✅ All assets inline (no separate JS/CSS files, PWA service worker excluded)"
fi

echo ""
echo "✅ Single-file build validation passed!"
echo "   File: dist/index.html (${SIZE_MB}MB)"
