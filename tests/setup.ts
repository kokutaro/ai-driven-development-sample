/**
 * Vitest global setup file
 *
 * This file is loaded before running tests and provides:
 * - Global test environment configuration
 * - Mock setup for external dependencies
 * - Shared utilities for all tests
 */
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Next.js router

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Cleanup after each test
afterEach(() => {
  cleanup()
})
