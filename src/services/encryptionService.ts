/**
 * Encryption Service
 * Implements SHA-256 hashing using Web Crypto API
 * Based on contracts/encryption-service.contract.ts
 */

/**
 * Hash a single value using SHA-256 with normalization for digital marketing consistency
 *
 * @param value - The string value to hash
 * @returns Promise resolving to 64-character lowercase hexadecimal SHA-256 hash, or null if value is empty after normalization
 *
 * @example
 * ```typescript
 * await hashValue("  JOHN DOE  ") // "94890005f3b2117a..." (normalized to "john doe")
 * await hashValue("JOHN DOE")     // "94890005f3b2117a..." (same hash as above)
 * await hashValue("   ")          // null (whitespace-only, skipped)
 * ```
 *
 * @remarks
 * For digital marketing purposes, values are normalized before hashing:
 * 1. Trim whitespace with .trim()
 * 2. Convert to lowercase with .toLowerCase()
 * 3. Return null if empty after normalization
 *
 * This ensures consistent hashing across platforms:
 * - Facebook Custom Audiences
 * - Google Customer Match
 * - LinkedIn Matched Audiences
 */
export async function hashValue(value: string): Promise<string | null> {
  // T023: Normalize value - trim whitespace and convert to lowercase
  const normalized = value.trim().toLowerCase();

  // T024: Skip encryption if empty after trim
  if (normalized === '') {
    return null;
  }

  // T025: Hash the normalized value (not the original)
  // Encode the normalized string as UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);

  // Hash the data using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert the hash to hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
