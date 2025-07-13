/**
 * CategoryLoader - カテゴリ情報の効率的な一括取得
 *
 * N+1クエリ問題を解決するため、複数のcategoryIdを
 * 一度のクエリでバッチ取得するDataLoaderです。
 */
import DataLoader from 'dataloader'

import type { Category, PrismaClient } from '@prisma/client'

/**
 * カテゴリDataLoader
 *
 * Todo.categoryフィールドの解決時に、
 * 複数のcategoryIdを効率的にバッチ取得します。
 */
export class CategoryLoader {
  private loader: DataLoader<string, Category | undefined>

  constructor(private prisma: PrismaClient) {
    this.loader = new DataLoader(
      async (
        categoryIds: readonly string[]
      ): Promise<(Category | undefined)[]> => {
        return this.batchLoadCategories(categoryIds)
      },
      {
        // 同一リクエスト内でのキャッシュを有効化
        cache: true,
        // キャッシュキーの設定
        cacheKeyFn: (categoryId: string) => categoryId,
        // バッチサイズの制限（オプション）
        maxBatchSize: 100,
      }
    )
  }

  /**
   * キャッシュをクリア
   */
  clear(categoryId: string): void {
    this.loader.clear(categoryId)
  }

  /**
   * 全キャッシュをクリア
   */
  clearAll(): void {
    this.loader.clearAll()
  }

  /**
   * 単一カテゴリをロード
   */
  async load(categoryId: string): Promise<Category | undefined> {
    return this.loader.load(categoryId)
  }

  /**
   * 複数カテゴリをロード
   */
  async loadMany(categoryIds: string[]): Promise<(Category | null)[]> {
    return this.loader.loadMany(categoryIds) as Promise<(Category | null)[]>
  }

  /**
   * バッチロード関数
   * 複数のcategoryIdを一度のPrismaクエリで取得
   */
  private async batchLoadCategories(
    categoryIds: readonly string[]
  ): Promise<(Category | undefined)[]> {
    try {
      // 重複を除去してユニークなIDのみ取得
      const uniqueIds = [...new Set(categoryIds)]

      // 一度のクエリで全カテゴリを取得
      const categories = await this.prisma.category.findMany({
        where: {
          id: {
            in: uniqueIds,
          },
        },
      })

      // IDでインデックス化
      const categoryMap = new Map<string, Category>()
      for (const category of categories) {
        categoryMap.set(category.id, category)
      }

      // 元の順序を保持して結果を返す
      return categoryIds.map((id) => categoryMap.get(id))
    } catch (error) {
      console.error('CategoryLoader batch load failed:', error)

      // カスタムエラーハンドリングを追加
      const { DataLoaderError } = await import('../errors/custom-errors')
      throw new DataLoaderError(
        'CategoryLoader',
        'batchLoadCategories',
        error instanceof Error ? error : new Error(String(error)),
        {
          batchSize: categoryIds.length,
          categoryIds: [...categoryIds],
        }
      )
    }
  }
}
