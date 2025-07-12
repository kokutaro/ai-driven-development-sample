import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn(() => 'adapter'),
}))
vi.mock('next-auth/providers/google', () => ({
  default: vi.fn(() => 'google'),
}))
vi.mock('next-auth/providers/github', () => ({
  default: vi.fn(() => 'github'),
}))
vi.mock('next-auth/providers/microsoft-entra-id', () => ({
  default: vi.fn(() => 'microsoft'),
}))

vi.mock('@/lib/db', () => ({ prisma: 'prisma' }))

interface NextAuthCallbacks {
  session: ({ session, user }: { session: { user?: { id?: string } }; user: { id: string } }) => Promise<{ user?: { id?: string } }>
  signIn: (args: { account?: { provider: string }; profile?: { login?: string; name?: string; }; user: { name?: string } }) => Promise<boolean>
}
interface NextAuthConfig {
  adapter: unknown
  callbacks: NextAuthCallbacks
  debug: boolean
  pages: { signIn: string }
  providers: unknown[]
  session: { strategy: string }
}

let capturedConfig: NextAuthConfig | undefined
vi.mock('next-auth', () => ({
  default: vi.fn((config: NextAuthConfig) => {
    capturedConfig = config
    return {
      auth: 'auth',
      handlers: { GET: 'get', POST: 'post' },
      signIn: 'nextSignIn',
      signOut: 'nextSignOut',
    }
  }),
}))

const loadModule = async () => await import('./auth')

beforeAll(async () => {
  await loadModule()
})

describe('auth configuration', () => {
  it('NextAuthが正しい設定で呼び出される', async () => {
    const mod = await loadModule()

    expect(mod.auth).toBe('auth')
    expect(mod.handlers.GET).toBe('get')
    expect(mod.handlers.POST).toBe('post')
    expect(mod.signIn).toBe('nextSignIn')
    expect(mod.signOut).toBe('nextSignOut')

    expect(capturedConfig!.adapter).toBe('adapter')
    expect(capturedConfig!.session.strategy).toBe('database')
    expect(capturedConfig!.pages.signIn).toBe('/auth/signin')
    expect(capturedConfig!.debug).toBe(false)
    expect(capturedConfig!.providers).toEqual(['google', 'microsoft', 'github'])
  })

  it('session callbackがユーザーIDを設定する', async () => {
    await loadModule()
    const session: { user?: { id?: string; name?: string } } = { user: { name: 'u' } }
    const user = { id: 'id1' }
    const result = await capturedConfig!.callbacks.session({ session, user })
    expect(result.user?.id).toBe('id1')
  })

  it('session callbackはユーザーがない場合そのまま返す', async () => {
    await loadModule()
    const session: { user?: { id?: string } } = {}
    const user = { id: 'id1' }
    const result = await capturedConfig!.callbacks.session({ session, user })
    expect(result).toBe(session)
  })

  it('signIn callbackがGoogleプロフィールから名前を設定する', async () => {
    await loadModule()
    const user: { name?: string } = {}
    await capturedConfig!.callbacks.signIn({
      account: { provider: 'google' },
      profile: { name: 'John' },
      user,
    })
    expect(user.name).toBe('John')
  })

  it('signIn callbackがGitHubプロフィールから名前を設定する', async () => {
    await loadModule()
    const user: { name?: string } = {}
    await capturedConfig!.callbacks.signIn({
      account: { provider: 'github' },
      profile: { login: 'john' },
      user,
    })
    expect(user.name).toBe('john')
  })

  it('signIn callbackがMicrosoftプロフィールから名前を設定する', async () => {
    await loadModule()
    const user: { name?: string } = {}
    await capturedConfig!.callbacks.signIn({
      account: { provider: 'microsoft-entra-id' },
      profile: { name: 'Mike' },
      user,
    })
    expect(user.name).toBe('Mike')
  })

  it('signIn callbackは既に名前がある場合変更しない', async () => {
    await loadModule()
    const user: { name?: string } = { name: 'Exists' }
    await capturedConfig!.callbacks.signIn({
      account: { provider: 'google' },
      profile: { name: 'John' },
      user,
    })
    expect(user.name).toBe('Exists')
  })

  it('signIn callbackはaccountがない場合何もしない', async () => {
    await loadModule()
    const user: { name?: string } = {}
    await capturedConfig!.callbacks.signIn({
      account: undefined,
      profile: undefined,
      user,
    })
    expect(user.name).toBeUndefined()
  })
})
