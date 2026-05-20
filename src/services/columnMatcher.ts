/**
 * Column Matcher Service
 *
 * Determines which columns should be encrypted using an exclusion-list model:
 * every column is hashed UNLESS its normalized name appears in `excludingColumn`.
 *
 * The exclusion list is sourced from `window.excludingColumn` (set in index.html)
 * and can be edited in the built single-file HTML without rebuilding.
 */

import type { ColumnMapping } from '../types/encryption.types';

declare global {
  interface Window {
    excludingColumn?: unknown;
  }
}

/**
 * Normalize a column name for fuzzy matching.
 * Lowercases and strips whitespace, underscores, and dashes.
 *
 * @example
 *   normalizeColumnName("First Name")  // "firstname"
 *   normalizeColumnName("E-Mail ")     // "email"
 */
export function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .trim();
}

/**
 * Read `window.excludingColumn` and coerce it to a sanitized string array.
 * Falls back to `[]` if missing, not an array, or contains non-strings.
 */
export function readExcludingColumnFromWindow(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = window.excludingColumn;
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    console.warn(
      '[columnMatcher] window.excludingColumn is not an array — ignoring and encrypting all columns.'
    );
    return [];
  }
  return raw.filter((v): v is string => typeof v === 'string');
}

function buildExcludedSet(excludingColumn: readonly string[]): Set<string> {
  const set = new Set<string>();
  for (const entry of excludingColumn) {
    const normalized = normalizeColumnName(entry);
    if (normalized !== '') set.add(normalized);
  }
  return set;
}

/**
 * Build a ColumnMapping for each header, with `isTarget = true` for every
 * column NOT in the exclusion list. Matching is case- and whitespace-insensitive
 * via `normalizeColumnName`.
 *
 * If `excludingColumn` is omitted, reads from `window.excludingColumn`.
 */
export function findColumnsToEncrypt(
  headers: string[],
  excludingColumn?: readonly string[]
): ColumnMapping[] {
  const excluded = buildExcludedSet(excludingColumn ?? readExcludingColumnFromWindow());

  return headers.map((header, index) => {
    const normalized = normalizeColumnName(header);
    return {
      originalName: header,
      normalizedName: normalized,
      isTarget: !excluded.has(normalized),
      columnIndex: index,
    };
  });
}

/**
 * True when at least one header is not excluded — i.e. there's something to hash.
 */
export function hasColumnsToEncrypt(
  headers: string[],
  excludingColumn?: readonly string[]
): boolean {
  return findColumnsToEncrypt(headers, excludingColumn).some((m) => m.isTarget);
}

/**
 * Return the original-cased headers that matched the exclusion list,
 * preserving the order they appear in `headers`.
 */
export function getExcludedHeaders(
  headers: string[],
  excludingColumn?: readonly string[]
): string[] {
  const excluded = buildExcludedSet(excludingColumn ?? readExcludingColumnFromWindow());
  return headers.filter((h) => excluded.has(normalizeColumnName(h)));
}
