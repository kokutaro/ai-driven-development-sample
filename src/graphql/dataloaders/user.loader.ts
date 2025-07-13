/**
 * UserLoader - ユーザー情報の効率的な一括取得
 *
 * N+1クエリ問題を解決するため、複数のuserIdを
 * 一度のクエリでバッチ取得するDataLoaderです。
 */
import DataLoader from 'dataloader'

import type { PrismaClient, User } from '@prisma/client'

/**
 * ユーザー選択フィールド（セキュリティ考慮）
 */
const USER_SELECT_FIELDS = {
  createdAt: true,
  email: true,
  id: true,
  name: true,
  updatedAt: true,
} as const

/**
 * 公開用ユーザー型
 */
export type PublicUser = Pick<User, keyof typeof USER_SELECT_FIELDS>

/**
 * ユーザーDataLoader
 *
 * Todo.user, Category.userなどのフィールドの解決時に、
 * 複数のuserIdを効率的にバッチ取得します。
 */
export class UserLoader {
  private loader: DataLoader<string, PublicUser | undefined>

  constructor(private prisma: PrismaClient) {
    this.loader = new DataLoader(
      async (
        userIds: readonly string[]
      ): Promise<(PublicUser | undefined)[]> => {
        return this.batchLoadUsers(userIds)
      },
      {
        // 同一リクエスト内でのキャッシュを有効化
        cache: true,
        // キャッシュキーの設定
        cacheKeyFn: (userId: string) => userId,
        // バッチサイズの制限
        maxBatchSize: 100,
      }
    )
  }

  /**
   * キャッシュをクリア
   */
  clear(userId: string): void {
    this.loader.clear(userId)
  }

  /**
   * 全キャッシュをクリア
   */
  clearAll(): void {
    this.loader.clearAll()
  }

  /**
   * 単一ユーザーをロード
   */
  async load(userId: string): Promise<PublicUser | undefined> {
    return this.loader.load(userId)
  }

  /**
   * 複数ユーザーをロード
   */
  async loadMany(userIds: string[]): Promise<(PublicUser | undefined)[]> {
    return this.loader.loadMany(userIds) as Promise<(PublicUser | undefined)[]>
  }

  /**
   * バッチロード関数
   * 複数のuserIdを一度のPrismaクエリで取得
   * セキュリティのため、公開可能なフィールドのみ選択
   */
  private async batchLoadUsers(
    userIds: readonly string[]
  ): Promise<(PublicUser | undefined)[]> {
    try {
      // 重複を除去してユニークなIDのみ取得
      const uniqueIds = [...new Set(userIds)]

      // 一度のクエリで全ユーザーを取得（公開フィールドのみ）
      const users = await this.prisma.user.findMany({
        select: USER_SELECT_FIELDS,
        where: {
          id: {
            in: uniqueIds,
          },
        },
      })

      // IDでインデックス化
      const userMap = new Map<string, PublicUser>()
      for (const user of users) {
        userMap.set(user.id, user)
      }

      // 元の順序を保持して結果を返す
      return userIds.map((id) => userMap.get(id))
    } catch (error) {
      console.error('UserLoader batch load failed:', error)

      // カスタムエラーハンドリングを追加
      const { DataLoaderError } = await import('../errors/custom-errors')
      throw new DataLoaderError(
        'UserLoader',
        'batchLoadUsers',
        error instanceof Error ? error : new Error(String(error)),
        {
          batchSize: userIds.length,
          userIds: [...userIds],
        }
      )
    }
  }
}
