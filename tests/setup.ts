/**
 * Vitest global setup file
 *
 * This file is loaded before running tests and provides:
 * - Global test environment configuration
 * - Mock setup for external dependencies
 * - Shared utilities for all tests
 */
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Mock Next.js router

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    asPath: '/',
    back: vi.fn(),
    forward: vi.fn(),
    pathname: '/',
    prefetch: vi.fn(),
    push: vi.fn(),
    query: {},
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Cleanup after each test
afterEach(() => {
  cleanup()
})
