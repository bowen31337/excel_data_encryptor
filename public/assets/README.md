# PWA Icons

This directory contains icons for the Progressive Web App.

## Current Icons

- `icon-192.svg` - 192×192px SVG icon with lock/encryption theme
- `icon-512.svg` - 512×512px SVG icon with lock/encryption theme

## Converting SVG to PNG (Optional)

SVG icons work in modern browsers and PWA manifests. If PNG format is specifically required, convert using:

```bash
# Using ImageMagick (if installed)
convert -background none -resize 192x192 icon-192.svg icon-192.png
convert -background none -resize 512x512 icon-512.svg icon-512.png

# Using rsvg-convert (if installed)
rsvg-convert -w 192 -h 192 icon-192.svg -o icon-192.png
rsvg-convert -w 512 -h 512 icon-512.svg -o icon-512.png

# Using Node.js (sharp package)
npm install -D sharp sharp-cli
npx sharp -i icon-192.svg -o icon-192.png resize 192 192
npx sharp -i icon-512.svg -o icon-512.png resize 512 512
```

## Design Notes

- Primary color: `#1890ff` (Ant Design blue)
- Background: Primary blue
- Foreground: White lock icon
- Lock design: Padlock with shackle and keyhole
- Suitable for light and dark mode displays
