// This file will be run before all tests
import { beforeAll, afterEach, vi } from 'vitest';

// Clear any environment mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});

// Silence console errors and warnings during tests
beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});
