# Excel Data Encryptor

A client-side web application that encrypts sensitive data in Excel and CSV files using SHA-256 hashing. All processing happens entirely in your browser - no data is ever sent to any server.

## Features

- ✅ **Client-Side Only**: All file processing happens in your browser
- 🔒 **SHA-256 Encryption**: Industry-standard one-way hashing with value normalization
- 📊 **Excel & CSV Support**: Works with .xlsx, .xls, and .csv files
- 🎯 **Smart Column Detection**: Automatically detects First Name, Last Name, Email, Mobile, and Phone columns
- 🔄 **Value Normalization**: Trims whitespace and converts to lowercase for digital marketing consistency
- 🚀 **Performance Optimized**: Handles files up to 100MB on desktop and mobile
- 📱 **Mobile-Friendly**: Fully responsive design optimized for smartphones and tablets (320px-768px)
- 📦 **Single-File Build**: Deploy as one standalone HTML file for offline use
- 💾 **PWA Support**: Install as a Progressive Web App for offline functionality

## Quick Start

### Online Version

Visit the live application at: [https://your-username.github.io/excel_data_encryptor](https://your-username.github.io/excel_data_encryptor)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/excel_data_encryptor.git
   cd excel_data_encryptor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## How to Use

1. **Upload a File**: Click or drag-and-drop an Excel (.xlsx, .xls) or CSV file
2. **Review File Info**: The app will display file details and detected columns
3. **Encrypt & Download**: Click the "Encrypt & Download" button
4. **Save Encrypted File**: The encrypted file will download automatically

## Supported Columns

The application automatically detects and encrypts these columns (case-insensitive, works with variations):

| Column Type | Variations |
|------------|------------|
| First Name | `FirstName`, `First_Name`, `first-name`, `fname` |
| Last Name | `LastName`, `Last_Name`, `last-name`, `lname` |
| Email | `Email`, `E-mail`, `Email Address`, `email_address` |
| Mobile | `Mobile`, `Mobile Number`, `mobile_number` |
| Phone | `Phone`, `Phone Number`, `phone_number`, `phonenumber`, `phone-number` |

### Value Normalization for Digital Marketing

All target column values are automatically normalized before SHA-256 hashing to ensure consistent matching across marketing platforms:

1. **Trim whitespace**: Leading and trailing spaces removed
2. **Convert to lowercase**: All characters converted to lowercase
3. **Skip empty cells**: Whitespace-only or empty cells are not encrypted

**Example**:
- `"  JOHN DOE  "` → normalized to `"john doe"` → SHA-256 hash
- `"JOHN DOE"` → normalized to `"john doe"` → **same hash as above**
- `"   "` (whitespace only) → skipped (empty cell in output)

## Important Notes

⚠️ **SHA-256 is a one-way hash** - Encrypted data cannot be decrypted or reversed

🔒 **Client-side processing** - Your data never leaves your browser

💾 **No data storage** - Files are not saved or logged anywhere

📏 **100MB file size limit** - Maximum supported file size

## Technology Stack

- **Frontend**: React 18, TypeScript 5.3+
- **UI Library**: Ant Design 5
- **File Processing**: SheetJS (xlsx), PapaParse
- **Hashing**: Web Crypto API (SHA-256)
- **Build Tool**: Vite 5
- **Testing**: Vitest, React Testing Library, Playwright
- **Linting**: Biome

## Mobile Support

The application is fully optimized for mobile devices:

- **Responsive Design**: Adapts to screens from 320px (iPhone SE) to 768px (tablets)
- **Touch-Friendly**: All buttons and interactive elements are ≥44px for easy tapping
- **Native File Picker**: Touch devices use the native file picker instead of drag-and-drop
- **Same Performance**: Maintains <500ms/MB encryption speed on mobile devices
- **Orientation Support**: Automatically adjusts layout when device is rotated

### Supported Mobile Browsers

- iOS Safari 14+
- Chrome Android 90+
- Samsung Internet 14+
- Firefox Android 88+

## Single-File Build

For offline deployment or air-gapped environments, you can build the entire application as a single self-contained HTML file:

```bash
npm run build:single
```

This creates a `dist/index.html` file with:
- All CSS inlined in `<style>` tags
- All JavaScript inlined in `<script>` tags
- No external dependencies or CDN resources
- Full functionality works from `file://` protocol
- Typical size: ~1-3MB (well under 10MB limit)

The single-file build is perfect for:
- Offline environments
- Security-restricted networks
- Easy distribution via email or USB drive
- Archival purposes

## Progressive Web App (PWA)

Install the application as a PWA for enhanced offline capability:

1. **On Desktop**: Click the install icon in your browser's address bar
2. **On Mobile**:
   - iOS: Tap "Share" → "Add to Home Screen"
   - Android: Tap menu → "Install App"

PWA Benefits:
- Works completely offline after first load
- Launches like a native app
- Automatic updates when online
- No app store required

## Browser Support

**Desktop:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile:**
- iOS Safari 14+
- Chrome Android 90+
- Samsung Internet 14+
- Firefox Android 88+

## Development

### Project Structure

```
/
├── src/
│   ├── components/       # React components
│   ├── services/         # Business logic (parsing, encryption, generation)
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions (validation)
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── public/               # Static assets
└── dist/                 # Build output
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (multi-file output)
- `npm run build:single` - Build single self-contained HTML file
- `npm run preview` - Preview production build
- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests (including mobile scenarios)
- `npm run lint` - Run Biome linter
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Biome

## Performance

- **Throughput**: < 500ms per MB
- **File Size**: Supports up to 100MB
- **UI Responsiveness**: < 100ms feedback during processing

## Security

- Content Security Policy (CSP) headers configured
- No external API calls or data transmission
- Industry-standard SHA-256 hashing via Web Crypto API
- Input validation for file types and sizes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [Ant Design](https://ant.design/)
- Excel parsing by [SheetJS](https://sheetjs.com/)
- CSV parsing by [PapaParse](https://www.papaparse.com/)

---

**⚠️ Disclaimer**: This tool is for legitimate data encryption purposes only. SHA-256 is irreversible - ensure you have backups of your original data before encryption.
