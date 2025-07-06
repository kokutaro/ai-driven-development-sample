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

// Mock window.matchMedia for Mantine
Object.defineProperty(globalThis, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(), // deprecated
    dispatchEvent: vi.fn(),
    matches: false,
    media: query,
    onchange: undefined,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(), // deprecated
  })),
  writable: true,
})

// Mock ResizeObserver for Mantine
Object.defineProperty(globalThis, 'ResizeObserver', {
  value: vi.fn().mockImplementation((_callback) => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  })),
  writable: true,
})

// Mock scrollIntoView for Mantine Combobox
Element.prototype.scrollIntoView = vi.fn()

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
