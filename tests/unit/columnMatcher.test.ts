/**
 * Unit tests for columnMatcher service (exclusion-list model).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  findColumnsToEncrypt,
  getExcludedHeaders,
  hasColumnsToEncrypt,
  normalizeColumnName,
  readExcludingColumnFromWindow,
} from '../../src/services/columnMatcher';

describe('columnMatcher - normalizeColumnName', () => {
  it('lowercases the input', () => {
    expect(normalizeColumnName('EMAIL')).toBe('email');
    expect(normalizeColumnName('LastName')).toBe('lastname');
    expect(normalizeColumnName('Address')).toBe('address');
  });

  it('trims outer whitespace', () => {
    expect(normalizeColumnName('  Name  ')).toBe('name');
    expect(normalizeColumnName('\tEmail\n')).toBe('email');
  });

  it('preserves internal whitespace, underscores, and dashes', () => {
    expect(normalizeColumnName('First Name')).toBe('first name');
    expect(normalizeColumnName('First_Name')).toBe('first_name');
    expect(normalizeColumnName('First-Name')).toBe('first-name');
    expect(normalizeColumnName(' Email - Address ')).toBe('email - address');
  });

  it('is deterministic', () => {
    const input = 'Test_Column-Name ';
    expect(normalizeColumnName(input)).toBe(normalizeColumnName(input));
  });
});

describe('columnMatcher - findColumnsToEncrypt', () => {
  it('marks every column as a target when the exclusion list is empty', () => {
    const headers = ['ID', 'Name', 'Email', 'Department'];
    const mappings = findColumnsToEncrypt(headers, []);
    expect(mappings).toHaveLength(4);
    expect(mappings.every((m) => m.isTarget)).toBe(true);
  });

  it('excludes columns whose normalized name appears in the exclusion list', () => {
    const headers = ['ID', 'Name', 'Email', 'Address'];
    const mappings = findColumnsToEncrypt(headers, ['name', 'address']);

    expect(mappings[0].isTarget).toBe(true); // ID
    expect(mappings[1].isTarget).toBe(false); // Name
    expect(mappings[2].isTarget).toBe(true); // Email
    expect(mappings[3].isTarget).toBe(false); // Address
  });

  it('matches case-insensitively and trims outer whitespace', () => {
    const headers = ['Name', 'NAME', '  name  ', '\tname\n'];
    const mappings = findColumnsToEncrypt(headers, ['name']);
    expect(mappings.every((m) => m.isTarget === false)).toBe(true);
  });

  it('does NOT match substrings, compound names, or names with internal separators', () => {
    const headers = ['Name', 'FirstName', 'Surname', 'first_name', 'name_', 'first-name'];
    const mappings = findColumnsToEncrypt(headers, ['name']);

    expect(mappings[0].isTarget).toBe(false); // 'Name' → 'name' — excluded
    expect(mappings[1].isTarget).toBe(true); // 'FirstName' → 'firstname' ≠ 'name'
    expect(mappings[2].isTarget).toBe(true); // 'Surname' ≠ 'name'
    expect(mappings[3].isTarget).toBe(true); // 'first_name' ≠ 'name' (separators preserved)
    expect(mappings[4].isTarget).toBe(true); // 'name_' ≠ 'name'
    expect(mappings[5].isTarget).toBe(true); // 'first-name' ≠ 'name'
  });

  it('preserves the original header name and column index', () => {
    const headers = ['ID', 'First Name', 'Last Name', 'Email'];
    const mappings = findColumnsToEncrypt(headers, ['id']);

    expect(mappings[0]).toMatchObject({
      originalName: 'ID',
      normalizedName: 'id',
      isTarget: false,
      columnIndex: 0,
    });
    expect(mappings[3]).toMatchObject({
      originalName: 'Email',
      normalizedName: 'email',
      isTarget: true,
      columnIndex: 3,
    });
  });

  it('handles an empty headers array', () => {
    expect(findColumnsToEncrypt([], ['anything'])).toEqual([]);
  });

  it('deduplicates exclusion entries via case-insensitive matching', () => {
    const headers = ['Name'];
    const mappings = findColumnsToEncrypt(headers, ['name', 'NAME', '  Name  ']);
    expect(mappings[0].isTarget).toBe(false);
  });

  it('ignores empty / whitespace-only exclusion entries', () => {
    const headers = ['', 'Email'];
    const mappings = findColumnsToEncrypt(headers, ['', '   ']);
    // Empty exclusion entries normalize to '' and are dropped, so nothing is excluded.
    expect(mappings.every((m) => m.isTarget)).toBe(true);
  });
});

describe('columnMatcher - hasColumnsToEncrypt', () => {
  it('returns true when at least one header is not excluded', () => {
    expect(hasColumnsToEncrypt(['ID', 'Name'], ['name'])).toBe(true);
  });

  it('returns false when every header is excluded', () => {
    expect(hasColumnsToEncrypt(['Name', 'Address'], ['name', 'address'])).toBe(false);
  });

  it('returns false for an empty headers array', () => {
    expect(hasColumnsToEncrypt([], [])).toBe(false);
  });
});

describe('columnMatcher - getExcludedHeaders', () => {
  it('returns original-cased headers that matched the exclusion list', () => {
    const headers = ['ID', 'Full Name', 'Email', 'ADDRESS'];
    expect(getExcludedHeaders(headers, ['full name', 'address'])).toEqual(['Full Name', 'ADDRESS']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(getExcludedHeaders(['ID', 'Email'], ['phone'])).toEqual([]);
  });
});

describe('columnMatcher - window.excludingColumn fallback', () => {
  const originalExcludingColumn = window.excludingColumn;

  beforeEach(() => {
    // Reset before each test
    (window as { excludingColumn?: unknown }).excludingColumn = undefined;
  });

  afterEach(() => {
    (window as { excludingColumn?: unknown }).excludingColumn = originalExcludingColumn;
    vi.restoreAllMocks();
  });

  it('reads the array from window when no argument is passed', () => {
    window.excludingColumn = ['email'];
    const mappings = findColumnsToEncrypt(['ID', 'Email']);
    expect(mappings[0].isTarget).toBe(true);
    expect(mappings[1].isTarget).toBe(false);
  });

  it('falls back to [] (encrypt everything) when window.excludingColumn is undefined', () => {
    expect(readExcludingColumnFromWindow()).toEqual([]);
    const mappings = findColumnsToEncrypt(['ID', 'Email']);
    expect(mappings.every((m) => m.isTarget)).toBe(true);
  });

  it('falls back to [] and warns when window.excludingColumn is not an array', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    window.excludingColumn = 'not an array' as unknown;
    expect(readExcludingColumnFromWindow()).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('drops non-string entries from window.excludingColumn', () => {
    window.excludingColumn = ['email', 123, null, 'phone'] as unknown;
    expect(readExcludingColumnFromWindow()).toEqual(['email', 'phone']);
  });
});
