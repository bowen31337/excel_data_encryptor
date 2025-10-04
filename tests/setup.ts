import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock Web Crypto API for tests
if (typeof global.crypto === 'undefined') {
  const { webcrypto } = require('node:crypto');
  global.crypto = webcrypto as Crypto;
}
