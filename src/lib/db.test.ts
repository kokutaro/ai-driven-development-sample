import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 既存のdb.tsモックを無効化
vi.unmock('@/lib/db')

// PrismaClientのモック実装
const mockPrismaClient = vi.fn().mockImplementation(() => ({
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  // 必要に応じて他のメソッドも追加可能
}))

// PrismaClientをモック化
vi.mock('@prisma/client', () => ({
  PrismaClient: mockPrismaClient,
}))

// 環境変数のモック用のヘルパー
const setNodeEnv = (env: string | undefined) => {
  vi.stubEnv('NODE_ENV', env)
}

describe('db.ts', () => {
  let originalGlobalForPrisma: unknown

  beforeEach(() => {
    // グローバルオブジェクトの初期状態を保存
    originalGlobalForPrisma = (globalThis as { prisma?: unknown }).prisma

    // グローバルオブジェクトをクリア
    delete (globalThis as { prisma?: unknown }).prisma

    // モジュールキャッシュをクリア
    vi.resetModules()
    vi.clearAllMocks()
    mockPrismaClient.mockClear()
  })

  afterEach(() => {
    // 元の状態に復元
    vi.unstubAllEnvs()

    if (originalGlobalForPrisma !== undefined) {
      ;(globalThis as { prisma?: unknown }).prisma = originalGlobalForPrisma
    } else {
      delete (globalThis as { prisma?: unknown }).prisma
    }
  })

  describe('PrismaClient instance creation', () => {
    it('should create a new PrismaClient instance in production environment', async () => {
      // Arrange
      setNodeEnv('production')

      // Act
      const { prisma } = await import('./db')

      // Assert
      expect(mockPrismaClient).toHaveBeenCalledOnce()
      expect(prisma).toBeDefined()
      expect(prisma).toBeInstanceOf(Object)
    })

    it('should create a new PrismaClient instance when globalForPrisma.prisma is undefined', async () => {
      // Arrange
      setNodeEnv('development')
      // globalForPrisma.prismaは既にundefinedの状態

      // Act
      const { prisma } = await import('./db')

      // Assert
      expect(mockPrismaClient).toHaveBeenCalledOnce()
      expect(prisma).toBeDefined()
    })
  })

  describe('PrismaClient caching in development environment', () => {
    it('should cache PrismaClient instance in globalForPrisma when NODE_ENV is not production', async () => {
      // Arrange
      setNodeEnv('development')

      // Act
      const { prisma } = await import('./db')

      // Assert
      expect((globalThis as { prisma?: unknown }).prisma).toBe(prisma)
      expect(mockPrismaClient).toHaveBeenCalledOnce()
    })

    it('should cache PrismaClient instance in globalForPrisma when NODE_ENV is test', async () => {
      // Arrange
      setNodeEnv('test')

      // Act
      const { prisma } = await import('./db')

      // Assert
      expect((globalThis as { prisma?: unknown }).prisma).toBe(prisma)
      expect(mockPrismaClient).toHaveBeenCalledOnce()
    })

    it('should not cache PrismaClient instance in globalForPrisma when NODE_ENV is production', async () => {
      // Arrange
      setNodeEnv('production')

      // Act
      await import('./db')

      // Assert
      expect((globalThis as { prisma?: unknown }).prisma).toBeUndefined()
      expect(mockPrismaClient).toHaveBeenCalledOnce()
    })
  })

  describe('Singleton pattern', () => {
    it('should return the same instance when imported multiple times in development', async () => {
      // Arrange
      setNodeEnv('development')

      // Act
      const { prisma: prisma1 } = await import('./db')
      // モジュールキャッシュをクリアせずに再インポート
      const { prisma: prisma2 } = await import('./db')

      // Assert
      expect(prisma1).toBe(prisma2)
      expect(mockPrismaClient).toHaveBeenCalledOnce() // 1回のみ呼ばれる
    })

    it('should reuse cached instance from globalForPrisma when available', async () => {
      // Arrange
      setNodeEnv('development')
      const mockPrismaInstance = mockPrismaClient()
      ;(globalThis as { prisma?: unknown }).prisma = mockPrismaInstance

      // Act
      const { prisma } = await import('./db')

      // Assert
      expect(prisma).toBe(mockPrismaInstance)
      expect(mockPrismaClient).toHaveBeenCalledOnce() // モック作成時の1回のみ
    })
  })

  describe('NODE_ENV environment variable handling', () => {
    it('should handle undefined NODE_ENV as non-production', async () => {
      // Arrange
      setNodeEnv(undefined)

      // Act
      const { prisma } = await import('./db')

      // Assert
      expect((globalThis as { prisma?: unknown }).prisma).toBe(prisma)
      expect(mockPrismaClient).toHaveBeenCalledOnce()
    })

    it('should handle empty string NODE_ENV as non-production', async () => {
      // Arrange
      setNodeEnv('')

      // Act
      const { prisma } = await import('./db')

      // Assert
      expect((globalThis as { prisma?: unknown }).prisma).toBe(prisma)
      expect(mockPrismaClient).toHaveBeenCalledOnce()
    })

    it('should handle custom environment names as non-production', async () => {
      // Arrange
      setNodeEnv('staging')

      // Act
      const { prisma } = await import('./db')

      // Assert
      expect((globalThis as { prisma?: unknown }).prisma).toBe(prisma)
      expect(mockPrismaClient).toHaveBeenCalledOnce()
    })
  })

  describe('globalForPrisma object manipulation', () => {
    it('should properly type cast globalThis to include prisma property', async () => {
      // Arrange
      setNodeEnv('development')

      // Act
      const { prisma } = await import('./db')

      // Assert
      // globalForPrismaの型安全性を確認
      const globalForPrisma = globalThis as {
        prisma?: unknown
      }
      expect(globalForPrisma.prisma).toBe(prisma)
      expect(typeof globalForPrisma.prisma).toBe('object')
    })

    it('should handle existing prisma property in globalThis', async () => {
      // Arrange
      setNodeEnv('development')
      const existingPrismaInstance = mockPrismaClient()
      ;(globalThis as { prisma?: unknown }).prisma = existingPrismaInstance

      // Act
      const { prisma } = await import('./db')

      // Assert
      expect(prisma).toBe(existingPrismaInstance)
      expect((globalThis as { prisma?: unknown }).prisma).toBe(
        existingPrismaInstance
      )
    })
  })

  describe('TypeScript type safety', () => {
    it('should export prisma with correct type', async () => {
      // Arrange
      setNodeEnv('development')

      // Act
      const { prisma } = await import('./db')

      // Assert
      // TypeScriptの型チェックによって、prismaが正しい型であることを確認
      expect(prisma).toBeDefined()
      expect(typeof prisma).toBe('object')
      // PrismaClientのインスタンスかモックされたオブジェクトかを確認
      expect(prisma).toHaveProperty('$connect')
      expect(prisma).toHaveProperty('$disconnect')
    })

    it('should maintain type safety for globalForPrisma', async () => {
      // Arrange
      setNodeEnv('development')

      // Act
      const { prisma } = await import('./db')

      // Assert
      const globalForPrisma = globalThis as {
        prisma?: unknown
      }

      // 型安全性の確認：undefinedまたはPrismaClientインスタンス
      expect(
        globalForPrisma.prisma === undefined ||
          typeof globalForPrisma.prisma === 'object'
      ).toBe(true)
      expect(globalForPrisma.prisma).toBe(prisma)
    })
  })

  describe('Null coalescing operator behavior', () => {
    it('should use null coalescing operator correctly when globalForPrisma.prisma is null', async () => {
      // Arrange
      setNodeEnv('development')
      ;(globalThis as { prisma?: unknown }).prisma = null

      // Act
      const { prisma } = await import('./db')

      // Assert
      expect(mockPrismaClient).toHaveBeenCalledOnce()
      expect(prisma).toBeDefined()
      expect((globalThis as { prisma?: unknown }).prisma).toBe(prisma)
    })

    it('should use null coalescing operator correctly when globalForPrisma.prisma is undefined', async () => {
      // Arrange
      setNodeEnv('development')
      ;(globalThis as { prisma?: unknown }).prisma = undefined

      // Act
      const { prisma } = await import('./db')

      // Assert
      expect(mockPrismaClient).toHaveBeenCalledOnce()
      expect(prisma).toBeDefined()
      expect((globalThis as { prisma?: unknown }).prisma).toBe(prisma)
    })

    it('should use existing instance when globalForPrisma.prisma is truthy', async () => {
      // Arrange
      setNodeEnv('development')
      const existingInstance = mockPrismaClient()
      ;(globalThis as { prisma?: unknown }).prisma = existingInstance

      // Act
      const { prisma } = await import('./db')

      // Assert
      expect(prisma).toBe(existingInstance)
      expect(mockPrismaClient).toHaveBeenCalledOnce() // 既存インスタンス作成時の1回のみ
    })
  })

  describe('Edge cases', () => {
    it('should handle multiple rapid imports correctly', async () => {
      // Arrange
      setNodeEnv('development')

      // Act
      const imports = await Promise.all([
        import('./db'),
        import('./db'),
        import('./db'),
      ])

      // Assert
      const prismaInstances = imports.map((module) => module.prisma)
      expect(prismaInstances[0]).toBe(prismaInstances[1])
      expect(prismaInstances[1]).toBe(prismaInstances[2])
      expect(mockPrismaClient).toHaveBeenCalledOnce()
    })

    it('should handle globalThis manipulation after module load', async () => {
      // Arrange
      setNodeEnv('development')

      // Act
      const { prisma: initialPrisma } = await import('./db')
      const anotherInstance = mockPrismaClient()
      ;(globalThis as { prisma?: unknown }).prisma = anotherInstance

      // モジュールを再読み込み
      vi.resetModules()
      const { prisma: newPrisma } = await import('./db')

      // Assert
      expect(newPrisma).toBe(anotherInstance)
      expect(newPrisma).not.toBe(initialPrisma)
    })
  })
})
