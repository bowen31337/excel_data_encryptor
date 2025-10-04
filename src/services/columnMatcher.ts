/**
 * Column Matcher Service
 * Implements fuzzy matching for target columns (First Name, Last Name, Email, Mobile, Phone)
 * Based on contracts/encryption-service.contract.ts
 */

import { type ColumnMapping, TargetColumnType } from '../types/encryption.types';

/**
 * Normalize a column name for fuzzy matching
 *
 * @param name - The column name to normalize
 * @returns Normalized column name (lowercase, no spaces/underscores/dashes)
 *
 * @example
 * ```typescript
 * normalizeColumnName("First Name")    // "firstname"
 * normalizeColumnName("First_Name")    // "firstname"
 * normalizeColumnName("first-name")    // "firstname"
 * normalizeColumnName("FIRST NAME")    // "firstname"
 * ```
 *
 * @remarks
 * Removes spaces, underscores, dashes and converts to lowercase for fuzzy matching
 */
export function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .trim();
}

/**
 * Find target columns in a list of headers using fuzzy matching
 *
 * @param headers - Array of column header names from the file
 * @returns Array of ColumnMapping objects with isTarget=true for matched columns
 *
 * @example
 * ```typescript
 * const headers = ["First Name", "Last_Name", "Email Address", "Phone Number"];
 * const mappings = findTargetColumns(headers);
 * // Returns:
 * // [
 * //   { originalName: "First Name", normalizedName: "firstname", isTarget: true, targetType: TargetColumnType.FirstName, columnIndex: 0 },
 * //   { originalName: "Last_Name", normalizedName: "lastname", isTarget: true, targetType: TargetColumnType.LastName, columnIndex: 1 },
 * //   { originalName: "Email Address", normalizedName: "emailaddress", isTarget: true, targetType: TargetColumnType.Email, columnIndex: 2 },
 * //   { originalName: "Phone Number", normalizedName: "phonenumber", isTarget: true, targetType: TargetColumnType.Phone, columnIndex: 3 }
 * // ]
 * ```
 *
 * @remarks
 * Supports fuzzy matching for variations of:
 * - First Name (firstname, fname, first_name, first-name)
 * - Last Name (lastname, lname, last_name, last-name)
 * - Email (email, emailaddress, e-mail)
 * - Mobile (mobile, mobilenumber, mobile_number)
 * - Phone (phone, phonenumber, phone_number)
 */
export function findTargetColumns(headers: string[]): ColumnMapping[] {
  const targetPatterns: Record<string, TargetColumnType> = {
    // First Name variations
    firstname: TargetColumnType.FirstName,
    fname: TargetColumnType.FirstName,

    // Last Name variations
    lastname: TargetColumnType.LastName,
    lname: TargetColumnType.LastName,

    // Email variations
    email: TargetColumnType.Email,
    emailaddress: TargetColumnType.Email,
    'e-mail': TargetColumnType.Email,

    // Mobile variations
    mobile: TargetColumnType.Mobile,
    mobilenumber: TargetColumnType.Mobile,

    // Phone variations
    phone: TargetColumnType.Phone,
    phonenumber: TargetColumnType.Phone,
  };

  return headers.map((header, index) => {
    const normalized = normalizeColumnName(header);
    const targetType = targetPatterns[normalized];

    return {
      originalName: header,
      normalizedName: normalized,
      isTarget: targetType !== undefined,
      targetType,
      columnIndex: index,
    };
  });
}

/**
 * Check if any target columns exist in headers
 */
export function hasTargetColumns(headers: string[]): boolean {
  const mappings = findTargetColumns(headers);
  return mappings.some((m) => m.isTarget);
}
