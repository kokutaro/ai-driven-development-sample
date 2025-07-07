import { PrismaClient } from '@prisma/client'

/**
 * Prismaクライアントのシングルトンインスタンス
 *
 * 開発環境では、ホットリロード時に複数のインスタンスが作成されるのを防ぐため、
 * globalオブジェクトにキャッシュします。
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
