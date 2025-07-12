import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test-utils'

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}))

const { SessionProvider } = await import('./session-provider')

describe('SessionProvider', () => {
  it('子要素をNextAuth SessionProviderでラップして表示する', () => {
    render(
      <SessionProvider>
        <div>test-child</div>
      </SessionProvider>
    )

    expect(screen.getByTestId('session-provider')).toBeInTheDocument()
    expect(screen.getByText('test-child')).toBeInTheDocument()
  })
})
