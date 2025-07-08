import { vi } from 'vitest'

/**
 * Prisma クライアントのモック
 *
 * テスト用にPrismaクライアントの各メソッドをモック化します。
 */
export const mockPrisma = {
  $transaction: vi.fn(),
  kanbanColumn: {
    create: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  todo: {
    updateMany: vi.fn(),
  },
}

// モジュールモック
vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

export { mockPrisma as prisma }
