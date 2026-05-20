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
  it('removes spaces, underscores, and dashes', () => {
    expect(normalizeColumnName('First Name')).toBe('firstname');
    expect(normalizeColumnName('First_Name')).toBe('firstname');
    expect(normalizeColumnName('First-Name')).toBe('firstname');
    expect(normalizeColumnName('FIRST-NAME')).toBe('firstname');
  });

  it('lowercases the input', () => {
    expect(normalizeColumnName('EMAIL')).toBe('email');
    expect(normalizeColumnName('LastName')).toBe('lastname');
  });

  it('handles mixed separators and surrounding whitespace', () => {
    expect(normalizeColumnName('First_Name-Test ')).toBe('firstnametest');
    expect(normalizeColumnName(' Email - Address_2 ')).toBe('emailaddress2');
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

  it('matches case- and whitespace-insensitively', () => {
    const headers = ['Name', 'NAME', '  name  ', 'name_'];
    const mappings = findColumnsToEncrypt(headers, ['name']);
    expect(mappings.every((m) => m.isTarget === false)).toBe(true);
  });

  it('does NOT match substrings or compound names', () => {
    const headers = ['Name', 'FirstName', 'Surname', 'first_name'];
    const mappings = findColumnsToEncrypt(headers, ['name']);

    expect(mappings[0].isTarget).toBe(false); // Name — excluded
    expect(mappings[1].isTarget).toBe(true); // FirstName — normalizes to "firstname", not "name"
    expect(mappings[2].isTarget).toBe(true); // Surname
    expect(mappings[3].isTarget).toBe(true); // first_name → "firstname"
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

  it('deduplicates exclusion entries via normalization', () => {
    const headers = ['Name'];
    const mappings = findColumnsToEncrypt(headers, ['name', 'NAME', ' name_ ']);
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
    expect(getExcludedHeaders(headers, ['fullname', 'address'])).toEqual(['Full Name', 'ADDRESS']);
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
