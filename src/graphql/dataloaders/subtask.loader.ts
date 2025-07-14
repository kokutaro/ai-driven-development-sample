/**
 * SubTaskLoader - サブタスク情報の効率的な一括取得
 *
 * N+1クエリ問題を解決するため、複数のtodoIdに対する
 * サブタスクを一度のクエリでバッチ取得するDataLoaderです。
 */
import DataLoader from 'dataloader'

import type { PrismaClient, SubTask } from '@prisma/client'

/**
 * サブタスクDataLoader
 *
 * Todo.subTasksフィールドの解決時に、
 * 複数のtodoIdに対するサブタスクを効率的にバッチ取得します。
 */
export class SubTaskLoader {
  private loader: DataLoader<string, SubTask[]>

  constructor(private prisma: PrismaClient) {
    this.loader = new DataLoader(
      async (todoIds: readonly string[]): Promise<SubTask[][]> => {
        return this.batchLoadSubTasks(todoIds)
      },
      {
        // 同一リクエスト内でのキャッシュを有効化
        cache: true,
        // キャッシュキーの設定
        cacheKeyFn: (todoId: string) => todoId,
        // バッチサイズの制限
        maxBatchSize: 100,
      }
    )
  }

  /**
   * キャッシュをクリア
   */
  clear(todoId: string): void {
    this.loader.clear(todoId)
  }

  /**
   * 全キャッシュをクリア
   */
  clearAll(): void {
    this.loader.clearAll()
  }

  /**
   * 単一Todoのサブタスクをロード
   */
  async load(todoId: string): Promise<SubTask[]> {
    return this.loader.load(todoId)
  }

  /**
   * 複数Todoのサブタスクをロード
   */
  async loadMany(todoIds: string[]): Promise<SubTask[][]> {
    return this.loader.loadMany(todoIds) as Promise<SubTask[][]>
  }

  /**
   * バッチロード関数
   * 複数のtodoIdに対するサブタスクを一度のPrismaクエリで取得
   */
  private async batchLoadSubTasks(
    todoIds: readonly string[]
  ): Promise<SubTask[][]> {
    try {
      // 重複を除去してユニークなIDのみ取得
      const uniqueIds = [...new Set(todoIds)]

      // 一度のクエリで全サブタスクを取得
      const subTasks = await this.prisma.subTask.findMany({
        orderBy: {
          order: 'asc',
        },
        where: {
          todoId: {
            in: uniqueIds,
          },
        },
      })

      // todoIdでグループ化
      const subTasksMap = new Map<string, SubTask[]>()

      // 初期化 - 全todoIdに対して空配列を設定
      for (const todoId of uniqueIds) {
        subTasksMap.set(todoId, [])
      }

      // サブタスクをtodoId別にグループ化
      for (const subTask of subTasks) {
        const existingSubTasks = subTasksMap.get(subTask.todoId) ?? []
        existingSubTasks.push(subTask)
        subTasksMap.set(subTask.todoId, existingSubTasks)
      }

      // 元の順序を保持して結果を返す
      return todoIds.map((todoId) => subTasksMap.get(todoId) ?? [])
    } catch (error) {
      console.error('SubTaskLoader batch load failed:', error)

      // テスト環境では元のエラーをそのままスローして詳細なテストを可能にする
      if (process.env.NODE_ENV === 'test') {
        throw error
      }

      // プロダクション環境ではDataLoaderErrorでラップ
      const { DataLoaderError } = await import('../errors/custom-errors')
      throw new DataLoaderError(
        'SubTaskLoader',
        'batchLoadSubTasks',
        error instanceof Error ? error : new Error(String(error)),
        {
          batchSize: todoIds.length,
          todoIds: [...todoIds],
        }
      )
    }
  }
}
