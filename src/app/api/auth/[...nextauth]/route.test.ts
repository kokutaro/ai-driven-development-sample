import { describe, expect, it, vi } from 'vitest'

vi.mock('@/auth', () => ({ handlers: { GET: 'get', POST: 'post' } }))

const route = await import('./route')

describe('auth route', () => {
  it('handlers をそのままエクスポートしている', () => {
    expect(route.GET).toBe('get')
    expect(route.POST).toBe('post')
  })
})
