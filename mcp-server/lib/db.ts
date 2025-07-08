import { PrismaClient } from '@prisma/client'

/**
 * MCP サーバー用 Prisma クライアント
 *
 * メインアプリケーションのデータベースへの接続を提供します。
 * MCP サーバーは独立したプロセスとして動作するため、
 * 独自の Prisma クライアントインスタンスを持ちます。
 */
export const mcpPrisma = new PrismaClient({
  log: ['error', 'warn'],
})

/**
 * データベース接続の初期化
 * 
 * MCPサーバー起動時に呼び出してデータベース接続を確立します。
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await mcpPrisma.$connect()
    console.error('MCP Server: Database connected successfully')
  } catch (error) {
    console.error('MCP Server: Failed to connect to database:', error)
    throw error
  }
}

/**
 * データベース接続の終了
 * 
 * MCPサーバー終了時に呼び出してクリーンアップを行います。
 */
export async function closeDatabase(): Promise<void> {
  try {
    await mcpPrisma.$disconnect()
    console.error('MCP Server: Database disconnected')
  } catch (error) {
    console.error('MCP Server: Error disconnecting from database:', error)
  }
}