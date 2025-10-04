/**
 * Contract tests for IColumnMatcher
 * These tests MUST fail until columnMatcher.ts is implemented
 * Based on contracts/encryption-service.contract.ts
 */

import { describe, expect, it } from 'vitest';
import { TargetColumnType } from '../../src/types/encryption.types';

// Import service (will fail until implemented)
import { findTargetColumns, normalizeColumnName } from '../../src/services/columnMatcher';

describe('columnMatcher - normalizeColumnName', () => {
  it('should remove spaces from column names', () => {
    expect(normalizeColumnName('First Name')).toBe('firstname');
    expect(normalizeColumnName('Last Name')).toBe('lastname');
    expect(normalizeColumnName('Email Address')).toBe('emailaddress');
  });

  it('should remove underscores from column names', () => {
    expect(normalizeColumnName('First_Name')).toBe('firstname');
    expect(normalizeColumnName('Last_Name')).toBe('lastname');
    expect(normalizeColumnName('Mobile_Number')).toBe('mobilenumber');
  });

  it('should remove dashes from column names', () => {
    expect(normalizeColumnName('First-Name')).toBe('firstname');
    expect(normalizeColumnName('E-mail')).toBe('email');
    expect(normalizeColumnName('FIRST-NAME')).toBe('firstname');
  });

  it('should convert to lowercase', () => {
    expect(normalizeColumnName('FIRSTNAME')).toBe('firstname');
    expect(normalizeColumnName('LastName')).toBe('lastname');
    expect(normalizeColumnName('EMAIL')).toBe('email');
  });

  it('should handle mixed separators', () => {
    expect(normalizeColumnName('First_Name-Test ')).toBe('firstnametest');
    expect(normalizeColumnName(' Email - Address_2 ')).toBe('emailaddress2');
  });

  it('should be deterministic', () => {
    const input = 'Test_Column-Name ';
    expect(normalizeColumnName(input)).toBe(normalizeColumnName(input));
  });
});

describe('columnMatcher - findTargetColumns', () => {
  it('should recognize exact "First Name" match', () => {
    const headers = ['ID', 'First Name', 'Department'];
    const mappings = findTargetColumns(headers);

    expect(mappings).toHaveLength(3);
    expect(mappings[1].isTarget).toBe(true);
    expect(mappings[1].targetType).toBe(TargetColumnType.FirstName);
    expect(mappings[1].originalName).toBe('First Name');
    expect(mappings[1].normalizedName).toBe('firstname');
  });

  it('should recognize "FirstName" variation', () => {
    const headers = ['FirstName'];
    const mappings = findTargetColumns(headers);

    expect(mappings[0].isTarget).toBe(true);
    expect(mappings[0].targetType).toBe(TargetColumnType.FirstName);
  });

  it('should recognize "first_name" variation', () => {
    const headers = ['first_name'];
    const mappings = findTargetColumns(headers);

    expect(mappings[0].isTarget).toBe(true);
    expect(mappings[0].targetType).toBe(TargetColumnType.FirstName);
  });

  it('should recognize "Last Name" variations', () => {
    const testCases = ['Last Name', 'LastName', 'last_name', 'LAST-NAME', 'lastName'];

    testCases.forEach((header) => {
      const mappings = findTargetColumns([header]);
      expect(mappings[0].isTarget).toBe(true);
      expect(mappings[0].targetType).toBe(TargetColumnType.LastName);
    });
  });

  it('should recognize "Email" variations including "Email Address"', () => {
    const testCases = ['Email', 'E-mail', 'Email Address', 'email_address', 'EMAIL'];

    testCases.forEach((header) => {
      const mappings = findTargetColumns([header]);
      expect(mappings[0].isTarget).toBe(true);
      expect(mappings[0].targetType).toBe(TargetColumnType.Email);
    });
  });

  it('should recognize "Mobile" variations', () => {
    const testCases = ['Mobile', 'Mobile Number', 'mobile_number', 'MOBILE', 'mobilenumber'];

    testCases.forEach((header) => {
      const mappings = findTargetColumns([header]);
      expect(mappings[0].isTarget).toBe(true);
      expect(mappings[0].targetType).toBe(TargetColumnType.Mobile);
    });
  });

  it('should mark non-target columns correctly', () => {
    const headers = ['ID', 'First Name', 'Department', 'Email'];
    const mappings = findTargetColumns(headers);

    expect(mappings[0].isTarget).toBe(false); // ID
    expect(mappings[1].isTarget).toBe(true); // First Name
    expect(mappings[2].isTarget).toBe(false); // Department
    expect(mappings[3].isTarget).toBe(true); // Email
  });

  it('should set correct column indices', () => {
    const headers = ['ID', 'First Name', 'Last Name', 'Email'];
    const mappings = findTargetColumns(headers);

    expect(mappings[0].columnIndex).toBe(0);
    expect(mappings[1].columnIndex).toBe(1);
    expect(mappings[2].columnIndex).toBe(2);
    expect(mappings[3].columnIndex).toBe(3);
  });

  it('should handle empty headers array', () => {
    const mappings = findTargetColumns([]);
    expect(mappings).toHaveLength(0);
  });

  it('should handle headers with no target columns', () => {
    const headers = ['ID', 'Product', 'Price', 'Quantity'];
    const mappings = findTargetColumns(headers);

    expect(mappings).toHaveLength(4);
    expect(mappings.every((m) => !m.isTarget)).toBe(true);
  });

  it('should handle headers with extra whitespace', () => {
    const headers = [' First Name ', '  Email  ', 'Mobile  '];
    const mappings = findTargetColumns(headers);

    expect(mappings[0].isTarget).toBe(true);
    expect(mappings[1].isTarget).toBe(true);
    expect(mappings[2].isTarget).toBe(true);
  });

  it('should be case-insensitive', () => {
    const headers = ['FIRSTNAME', 'lastname', 'EmAiL', 'MOBILE'];
    const mappings = findTargetColumns(headers);

    expect(mappings.every((m) => m.isTarget)).toBe(true);
  });

  it('should recognize "Phone" variations', () => {
    const testCases = [
      'Phone',
      'phone',
      'PHONE',
      'Phone Number',
      'phone_number',
      'PhoneNumber',
      'phonenumber',
    ];

    testCases.forEach((header) => {
      const mappings = findTargetColumns([header]);
      expect(mappings[0].isTarget).toBe(true);
      expect(mappings[0].targetType).toBe(TargetColumnType.Phone);
    });
  });

  it('should distinguish between Phone and Mobile columns', () => {
    const headers = ['Mobile', 'Phone'];
    const mappings = findTargetColumns(headers);

    expect(mappings[0].isTarget).toBe(true);
    expect(mappings[0].targetType).toBe(TargetColumnType.Mobile);
    expect(mappings[1].isTarget).toBe(true);
    expect(mappings[1].targetType).toBe(TargetColumnType.Phone);
  });
});
