/**
 * Service Contracts for Excel Data Encryptor
 *
 * These interfaces define the contracts for all core services in the application.
 * All implementations MUST adhere to these contracts.
 * Contract tests verify behavior without implementation details.
 */

// ============================================================================
// Type Definitions (from data-model.md)
// ============================================================================

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface ParsedData {
  headers: string[];
  rows: CellValue[][];
  sheetName?: string;
  rowCount: number;
  columnCount: number;
}

export type CellValue = string | number | boolean | null | undefined;

export interface ColumnMapping {
  originalName: string;
  normalizedName: string;
  isTarget: boolean;
  targetType?: TargetColumnType;
  columnIndex: number;
}

export enum TargetColumnType {
  FirstName = 'FIRST_NAME',
  LastName = 'LAST_NAME',
  Mobile = 'MOBILE',
  Email = 'EMAIL',
}

export interface EncryptionResult {
  success: boolean;
  message: string;
  processedData?: ParsedData;
  stats: EncryptionStats;
  errors?: string[];
}

export interface EncryptionStats {
  totalRows: number;
  encryptedCells: number;
  emptyCellsSkipped: number;
  targetColumnsFound: string[];
  processingTimeMs: number;
}

export interface ProcessedFile {
  blob: Blob;
  filename: string;
  mimeType: string;
  size: number;
  generatedAt: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// Service Contracts
// ============================================================================

/**
 * IEncryptionService
 *
 * Responsible for SHA-256 hashing and orchestrating the encryption process.
 *
 * Contract Requirements:
 * - hashValue() MUST return a 64-character lowercase hexadecimal string
 * - hashValue() MUST be deterministic (same input → same output)
 * - hashValue('') MUST return SHA-256 hash of empty string
 * - processFile() MUST preserve non-target columns unchanged
 * - processFile() MUST leave empty cells empty (not hash them)
 * - processFile() MUST use fuzzy matching for target columns
 * - processFile() MUST handle files up to 100MB without crashing
 * - processFile() MUST achieve <500ms per MB throughput
 */
export interface IEncryptionService {
  /**
   * Hash a single value using SHA-256.
   *
   * @param value - The string to hash
   * @returns Promise resolving to 64-char hex string (e.g., "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
   *
   * @throws Never throws - returns hash of empty string for null/undefined
   */
  hashValue(value: string): Promise<string>;

  /**
   * Process a file: parse, identify target columns, encrypt them, generate output.
   *
   * @param file - The uploaded File object
   * @param onProgress - Optional callback for progress updates (0-100)
   * @returns Promise resolving to EncryptionResult
   *
   * @throws Never throws - returns EncryptionResult with success=false on errors
   */
  processFile(file: File, onProgress?: (percent: number) => void): Promise<EncryptionResult>;

  /**
   * Validate a file before processing.
   *
   * @param file - The File object to validate
   * @returns ValidationResult with isValid and error messages
   */
  validateFile(file: File): ValidationResult;
}

/**
 * IColumnMatcher
 *
 * Responsible for fuzzy matching column names to identify target columns.
 *
 * Contract Requirements:
 * - normalizeColumnName() MUST remove spaces, underscores, dashes
 * - normalizeColumnName() MUST convert to lowercase
 * - normalizeColumnName() MUST be deterministic
 * - findTargetColumns() MUST recognize variations:
 *   * "First Name", "FirstName", "first_name", "FIRST-NAME" → firstName
 *   * "Last Name", "LastName", "last_name", "LAST-NAME" → lastName
 *   * "Email", "E-mail", "Email Address", "email_address" → email
 *   * "Mobile", "Mobile Number", "Phone", "mobile_number" → mobile
 * - findTargetColumns() MUST handle headers with extra spaces
 * - findTargetColumns() MUST be case-insensitive
 */
export interface IColumnMatcher {
  /**
   * Normalize a column name for fuzzy matching.
   *
   * @param name - Original column header
   * @returns Normalized name (lowercase, no spaces/underscores/dashes)
   *
   * @example
   * normalizeColumnName("First_Name") → "firstname"
   * normalizeColumnName("E-mail Address") → "emailaddress"
   */
  normalizeColumnName(name: string): string;

  /**
   * Find target columns in a list of headers.
   *
   * @param headers - Array of column headers from file
   * @returns Array of ColumnMapping for all columns (isTarget=true for matches)
   *
   * @example
   * findTargetColumns(["ID", "First_Name", "Email"]) →
   * [
   *   { originalName: "ID", normalizedName: "id", isTarget: false, columnIndex: 0 },
   *   { originalName: "First_Name", normalizedName: "firstname", isTarget: true, targetType: "FIRST_NAME", columnIndex: 1 },
   *   { originalName: "Email", normalizedName: "email", isTarget: true, targetType: "EMAIL", columnIndex: 2 }
   * ]
   */
  findTargetColumns(headers: string[]): ColumnMapping[];

  /**
   * Check if any target columns exist in headers.
   *
   * @param headers - Array of column headers
   * @returns True if at least one target column found
   */
  hasTargetColumns(headers: string[]): boolean;
}

/**
 * IFileParser
 *
 * Responsible for parsing Excel and CSV files into ParsedData.
 *
 * Contract Requirements:
 * - parseExcel() MUST support .xlsx and .xls formats
 * - parseExcel() MUST process only the first sheet
 * - parseExcel() MUST treat first row as headers
 * - parseCSV() MUST handle quoted fields and embedded commas
 * - parseCSV() MUST detect delimiters automatically
 * - Both parsers MUST handle empty cells (null/undefined)
 * - Both parsers MUST handle Unicode characters
 * - Both parsers MUST handle files up to 100MB
 */
export interface IFileParser {
  /**
   * Parse an Excel file (.xlsx or .xls).
   *
   * @param file - The File object to parse
   * @returns Promise resolving to ParsedData
   *
   * @throws Error if file is corrupted or password-protected
   */
  parseExcel(file: File): Promise<ParsedData>;

  /**
   * Parse a CSV file.
   *
   * @param file - The File object to parse
   * @returns Promise resolving to ParsedData
   *
   * @throws Error if file encoding is unsupported or malformed
   */
  parseCSV(file: File): Promise<ParsedData>;

  /**
   * Determine file type from File object.
   *
   * @param file - The File object
   * @returns 'excel' | 'csv' | 'unknown'
   */
  detectFileType(file: File): 'excel' | 'csv' | 'unknown';
}

/**
 * IFileGenerator
 *
 * Responsible for generating Excel/CSV files from ProcessedData.
 *
 * Contract Requirements:
 * - generateExcel() MUST create valid .xlsx files
 * - generateCSV() MUST properly quote fields with commas
 * - generateDownloadFilename() MUST follow pattern: [name]_[YYYY-MM-DD]_encrypted.[ext]
 * - generateDownloadFilename() MUST handle filenames with multiple dots
 * - Both generators MUST preserve empty cells
 * - Both generators MUST handle Unicode characters
 */
export interface IFileGenerator {
  /**
   * Generate an Excel file from ParsedData.
   *
   * @param data - The data to write
   * @param originalFilename - Original filename for metadata
   * @returns Blob containing Excel file
   */
  generateExcel(data: ParsedData, originalFilename: string): Blob;

  /**
   * Generate a CSV file from ParsedData.
   *
   * @param data - The data to write
   * @returns Blob containing CSV file
   */
  generateCSV(data: ParsedData): Blob;

  /**
   * Generate download filename with timestamp.
   *
   * @param originalFilename - Original file name (e.g., "employees.xlsx")
   * @param date - Date to use in filename (defaults to today)
   * @returns Formatted filename (e.g., "employees_2025-10-02_encrypted.xlsx")
   *
   * @example
   * generateDownloadFilename("data.csv") → "data_2025-10-02_encrypted.csv"
   * generateDownloadFilename("my.data.xlsx") → "my.data_2025-10-02_encrypted.xlsx"
   */
  generateDownloadFilename(originalFilename: string, date?: Date): string;

  /**
   * Trigger browser download of a Blob.
   *
   * @param blob - The file data
   * @param filename - The filename for download
   */
  downloadFile(blob: Blob, filename: string): void;
}

// ============================================================================
// Contract Test Guidelines
// ============================================================================

/**
 * Contract tests MUST verify:
 *
 * 1. IEncryptionService:
 *    - SHA-256("test") returns correct hash
 *    - SHA-256("") returns hash of empty string
 *    - processFile() with target columns returns success
 *    - processFile() with no target columns returns error
 *    - processFile() leaves empty cells empty
 *    - processFile() preserves non-target columns
 *    - processFile() meets performance target (<500ms/MB)
 *
 * 2. IColumnMatcher:
 *    - Normalization removes spaces, underscores, dashes
 *    - Normalization is case-insensitive
 *    - Fuzzy matching recognizes all variations:
 *      * "First Name" variants
 *      * "Last Name" variants
 *      * "Email" variants (including "Email Address")
 *      * "Mobile" variants (including "Phone")
 *    - Returns empty array if no matches
 *    - Handles duplicate column names gracefully
 *
 * 3. IFileParser:
 *    - parseExcel() reads .xlsx files correctly
 *    - parseExcel() reads .xls files correctly
 *    - parseExcel() processes only first sheet
 *    - parseCSV() handles quoted fields
 *    - parseCSV() handles embedded commas and newlines
 *    - Both handle empty cells
 *    - Both handle Unicode characters
 *    - Both throw errors for corrupted files
 *
 * 4. IFileGenerator:
 *    - generateExcel() creates valid Excel files
 *    - generateCSV() creates valid CSV files
 *    - generateDownloadFilename() follows timestamp pattern
 *    - generateDownloadFilename() handles multiple dots
 *    - Both preserve empty cells
 *    - downloadFile() triggers browser download
 */

/**
 * Performance Benchmarks:
 *
 * These tests MUST be automated and MUST fail if thresholds exceeded:
 *
 * - 10MB CSV with 100k rows: <5s end-to-end
 * - 50MB Excel with 500k rows: <25s end-to-end
 * - 100MB CSV with 1M rows: <50s end-to-end
 * - SHA-256 hashing: >1000 values/second
 * - Column matching: <10ms for 100 columns
 * - File parsing: <500ms per MB
 * - File generation: <500ms per MB
 */
