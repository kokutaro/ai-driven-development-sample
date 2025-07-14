/**
 * DataLoaderContext - GraphQLコンテキスト用DataLoader統合
 *
 * GraphQLリクエストごとに新しいDataLoaderインスタンスを提供し、
 * N+1クエリ問題を解決します。
 */
import type { PrismaClient } from '@prisma/client'

import { CategoryLoader } from '@/graphql/dataloaders/category.loader'
import { SubTaskLoader } from '@/graphql/dataloaders/subtask.loader'
import { UserLoader } from '@/graphql/dataloaders/user.loader'

/**
 * DataLoader統計情報の型定義
 */
export interface DataLoaderStats {
  requestId: string
  timestamp: Date
}

/**
 * GraphQLコンテキスト拡張用の型定義
 */
export interface GraphQLContextWithDataLoader {
  dataloaders: DataLoaderContext
  // 他のコンテキストフィールド...
}

/**
 * DataLoaderコンテキスト
 *
 * GraphQLリクエストごとに新しいインスタンスを作成し、
 * リクエスト間でのキャッシュ汚染を防ぎます。
 */
export class DataLoaderContext {
  public readonly categoryLoader: CategoryLoader
  public readonly subTaskLoader: SubTaskLoader
  public readonly userLoader: UserLoader

  constructor(prisma: PrismaClient) {
    // 各リクエストで新しいDataLoaderインスタンスを作成
    this.categoryLoader = new CategoryLoader(prisma)
    this.subTaskLoader = new SubTaskLoader(prisma)
    this.userLoader = new UserLoader(prisma)
  }

  /**
   * 全DataLoaderのキャッシュをクリア
   *
   * デバッグ時やテスト時に使用
   */
  clearAllCaches(): void {
    this.categoryLoader.clearAll()
    this.subTaskLoader.clearAll()
    this.userLoader.clearAll()
  }

  /**
   * DataLoaderの統計情報を取得
   *
   * パフォーマンス監視やデバッグ用
   */
  getStats(): DataLoaderStats {
    return {
      requestId: Math.random().toString(36).slice(2, 11),
      // DataLoaderには直接的な統計APIがないため、
      // 独自実装またはカスタムメトリクスを追加可能
      timestamp: new Date(),
    }
  }
}
