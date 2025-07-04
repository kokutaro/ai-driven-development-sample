import { PrismaClient } from '@prisma/client'

/**
 * Prismaクライアントのシングルトンインスタンス
 *
 * @description グローバルなPrismaクライアントインスタンスを管理
 * 開発環境では複数のインスタンスが作成されることを防ぐため、
 * globalThisにクライアントを保存する
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prismaクライアントの初期化
 *
 * @description データベースへの接続を管理するPrismaクライアントを作成
 * 開発環境では既存のインスタンスを再利用し、
 * 本番環境では新しいインスタンスを作成
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
